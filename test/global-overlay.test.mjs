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
