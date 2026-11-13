import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { chromium } from 'playwright';

test('宠物浮层仍挂在 body 下，但不再铺满窗口', async () => {
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalOverlay } from './src/global-overlay.tsx';
window.petClicks = 0;
createRoot(document.getElementById('mount')).render(
  <GlobalOverlay>
    <button id="pet" style={{ position: 'fixed', right: '20px', bottom: '20px', width: '40px', height: '40px', pointerEvents: 'auto' }}
      onClick={() => { window.petClicks += 1; }}>Pet</button>
  </GlobalOverlay>
);`,
      resolveDir: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    define: { 'process.env.NODE_ENV': '"development"' },
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.setContent(`<!doctype html>
<html data-platform="darwin">
<head><style>
  html[data-platform=darwin] [data-window-drag] { -webkit-app-region: drag }
  html[data-platform=darwin] body>:not(#root) { -webkit-app-region: no-drag }
  #root { min-height: 100vh }
  [data-window-drag] { position: fixed; top: 0; left: 0; width: 800px; height: 40px }
</style></head>
<body>
  <div id="root"><div data-window-drag id="drag"></div></div>
  <div id="mount"></div>
</body>
</html>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const overlay = page.locator('body > [data-dsh-pet-overlay]');
    await overlay.waitFor({ state: 'attached' });
    assert.equal(await overlay.count(), 1);
    const box = await overlay.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    assert.equal(box.width, 0, '浮层边框不得盖住窗口拖拽区');
    assert.equal(box.height, 0, '浮层边框不得盖住窗口拖拽区');
    const drag = await page.evaluate(() => {
      const regions = [];
      for (const element of document.querySelectorAll('*')) {
        const style = getComputedStyle(element);
        const region = style.getPropertyValue('-webkit-app-region');
        if (region !== 'drag' && region !== 'no-drag') continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        regions.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, draggable: region === 'drag' });
      }
      const hit = (x, y) => {
        let draggable = false;
        for (const region of regions) {
          if (x >= region.x && x < region.x + region.width && y >= region.y && y < region.y + region.height) draggable = region.draggable;
        }
        return draggable;
      };
      return {
        overlayCounted: regions.some((region) => region.width >= 800 && region.height >= 600 && region.draggable === false),
        titleDraggable: hit(400, 20),
      };
    });
    assert.equal(drag.overlayCounted, false, '零尺寸浮层不得进入禁拖区');
    assert.equal(drag.titleDraggable, true, '标题栏拖拽点不得被浮层扣掉');
    await page.locator('#pet').click();
    assert.equal(await page.evaluate(() => window.petClicks), 1);
    assert.equal(await page.evaluate(() => document.elementFromPoint(400, 300)?.closest('[data-dsh-pet-overlay]') ?? null), null);
  } finally {
    await browser.close();
  }
});

test('0.2.2-rc.2 收窄拖拽排除后，浮层与托盘/菜单通过 data-window-drag-exclude 保持标题栏上方可交互', async () => {
  const bundle = await build({
    stdin: {
      contents: `import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalOverlay } from './src/global-overlay.tsx';
import { FloatingPet } from './src/ui.tsx';
const pet = { id: 'codex', name: 'Codex', description: 'desc', version: 2, source: 'builtin', url: '/asset/codex', displayLocale: 'zh' };
const config = { selected: 'codex', visible: true, size: 64, position: { x: 0, y: 0 } };
const tray = {
  state: {
    items: [{ id: 's1', token: '0:', pose: 'running', text: '正在工作', title: 'Task 1', updatedAt: 1 }],
    activity: { pose: 'running', text: '正在工作', title: 'Task 1', sessionId: 's1' },
    hidden: 0,
  },
  command: async () => {},
};
createRoot(document.getElementById('mount')).render(
  <GlobalOverlay>
    <FloatingPet pet={pet} config={config} activity={tray.state.activity} tray={tray} update={async () => {}} open={() => {}} settings={() => {}} />
  </GlobalOverlay>
);`,
      resolveDir: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
      loader: 'tsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{
      name: 'mock-primitives',
      setup(buildContext) {
        buildContext.onResolve({ filter: /^@deepseek-ai\/dsh-client-ui-primitives$/ }, () => ({ path: 'mock-primitives', namespace: 'mock' }));
        buildContext.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
          contents: 'import React from "react"; export const Button = ({ icon, variant, size, ...rest }) => React.createElement("button", rest); export const Modal = ({ children }) => children; export const IconEditOutlineRegular = () => null; export const IconListPenOutlineMedium = () => null;',
          loader: 'js',
          resolveDir: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
        }));
      },
    }],
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.setContent(`<!doctype html>
<html data-platform="darwin">
<head><style>
  :where(html[data-platform=darwin] *) { -webkit-app-region: initial }
  html[data-platform=darwin] [data-window-drag] { -webkit-app-region: drag }
  html[data-platform=darwin] body>:not(#root) { -webkit-app-region: no-drag }
  html[data-platform=darwin] [data-window-drag-exclude] { -webkit-app-region: no-drag }
  html[data-platform=darwin] :where([data-window-drag],[data-window-drag-controls]) :is(button,a,input,select,textarea,[role=menu]):where(:not([data-window-drag-exclude] *)) { -webkit-app-region: no-drag }
  #root { min-height: 100vh }
  [data-window-drag] { position: fixed; top: 0; left: 0; width: 800px; height: 48px }
</style></head>
<body>
  <div id="root"><div data-window-drag id="drag"></div></div>
  <div id="mount"></div>
</body>
</html>`);
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.locator('.dcp-floating').waitFor();
    await page.locator('.dcp-tray').waitFor();
    const attrs = await page.evaluate(() => ({
      floatingExclude: document.querySelector('.dcp-floating')?.hasAttribute('data-window-drag-exclude') ?? false,
      trayExclude: document.querySelector('.dcp-tray')?.hasAttribute('data-window-drag-exclude') ?? false,
      floatingRegion: getComputedStyle(document.querySelector('.dcp-floating')).getPropertyValue('-webkit-app-region'),
      trayRegion: getComputedStyle(document.querySelector('.dcp-tray')).getPropertyValue('-webkit-app-region'),
    }));
    assert.equal(attrs.floatingExclude, true, 'FloatingPet 必须声明 data-window-drag-exclude');
    assert.equal(attrs.trayExclude, true, 'NotificationTray 必须声明 data-window-drag-exclude');
    assert.equal(attrs.floatingRegion, 'no-drag', 'FloatingPet 在 darwin 下必须为 no-drag');
    assert.equal(attrs.trayRegion, 'no-drag', 'NotificationTray 在 darwin 下必须为 no-drag');
    await page.locator('.dcp-pet-button').click({ button: 'right' });
    await page.locator('.dcp-menu').waitFor();
    const menuAttrs = await page.evaluate(() => ({
      menuExclude: document.querySelector('.dcp-menu')?.hasAttribute('data-window-drag-exclude') ?? false,
      menuRegion: getComputedStyle(document.querySelector('.dcp-menu')).getPropertyValue('-webkit-app-region'),
    }));
    assert.equal(menuAttrs.menuExclude, true, '右键菜单必须声明 data-window-drag-exclude');
    assert.equal(menuAttrs.menuRegion, 'no-drag', '右键菜单在 darwin 下必须为 no-drag');
  } finally {
    await browser.close();
  }
});
