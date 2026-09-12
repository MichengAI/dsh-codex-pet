/** 跨插件浏览器回归，需同级 dsh-codex-ui 源码。 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { chromium } from 'playwright';

const uiRoot = new URL('../../dsh-codex-ui/src/client/', import.meta.url);
const source = await readFile(new URL('CodexSettingsPage.tsx', uiRoot), 'utf8');
const stylesSource = await readFile(new URL('settings-page-styles.ts', uiRoot), 'utf8');
// 执行实际设置页 effect，验证隔离、焦点与清理，而非复制一套实现。
const start = source.indexOf('    const hidden = new Map');
const end = source.indexOf('\n  }, [open, close, step?.id])', start);
assert.ok(start >= 0 && end > start);
const effect = (await transform(`function setup() {${source.slice(start, end)}\n}`, { loader: 'ts' })).code;
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {GlobalOverlay} from './src/global-overlay.tsx';
    window.root=createRoot(document.getElementById('mount'));
    window.root.render(<React.StrictMode><GlobalOverlay><button id="pet" style={{position:'fixed',right:20,bottom:20,pointerEvents:'auto'}} onClick={()=>window.petClicks=(window.petClicks||0)+1}>Pet</button></GlobalOverlay></React.StrictMode>);`,
    resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' },
});
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(`<style>${stylesSource.slice(stylesSource.indexOf('`') + 1, stylesSource.lastIndexOf('`'))}</style><div id="mount"></div><button id="background">背景</button><div id="settings" class="dcu-settings-page"><button id="back">返回</button></div>`);
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  await page.locator('#pet').waitFor();
  assert.equal(await page.locator('body > [data-dsh-pet-overlay]').count(), 1);
  await page.evaluate(effect => {
    window.close = () => {};
    window.page = { current: document.querySelector('#settings') };
    window.back = { current: document.querySelector('#back') };
    window.onboardingRoot = { current: null };
    window.step = undefined;
    window.settingsOverlays = () => [];
    window.settingsElementAvailable = node => !node.inert && getComputedStyle(node).visibility !== 'hidden';
    window.activate = new Function(`${effect}; return setup;`)();
  }, effect);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { window.cleanup = window.activate(); });
    assert.equal(await page.locator('#background').isVisible(), false);
    assert.equal(await page.locator('#pet').isVisible(), true);
    await page.locator('#pet').click();
    assert.equal(await page.locator('#pet').evaluate(node => document.activeElement === node), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#back').evaluate(node => document.activeElement === node), true);
    assert.equal(await page.evaluate(() => document.elementFromPoint(700, 300).closest('[data-dsh-pet-overlay]') === null), true);
    await page.evaluate(() => { window.cleanup(); });
    assert.equal(await page.locator('#background').isVisible(), true);
  }
  assert.equal(await page.evaluate(() => window.petClicks), 3);
  await page.evaluate(() => window.root.unmount());
  assert.equal(await page.locator('[data-dsh-pet-overlay]').count(), 0);
  console.log('全局 Pet：设置页显示、点击、焦点循环、空白穿透、重复切换与卸载清理通过');
} finally { await browser.close(); }
