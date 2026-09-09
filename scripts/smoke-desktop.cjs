// 在隔离 Electron 实例内验证真实 BrowserWindow，不启动或改动用户的 DSH 会话。
const { app, BrowserWindow } = require('electron');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { mkdirSync, writeFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const desktop = resolve('../dsh-codex-desktop');
app.disableHardwareAcceleration();
app.setPath('userData', resolve('.preview/electron'));
app.setAppPath(desktop);
app.whenReady().then(async () => {
  const { createHost } = await import('../lib/index.js');
  const host = await createHost({ dataRoot: resolve('.preview/desktop-data') });
  const server = require('node:http').createServer((req, res) => void host.handler(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { installPetWindow } = await import(pathToFileURL(join(desktop, 'dist/src/pet-window.js')).href);
  const source = new BrowserWindow({ show: false, webPreferences: { preload: join(desktop, 'dist/src/dsh-view-preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false } });
  const dispose = installPetWindow({ source: () => source.webContents, reveal() {} });
  try {
    // 使用同源只读页面作为发送端，避免预览页的自动同步与测试状态竞争。
    await source.loadURL(`http://127.0.0.1:${server.address().port}/dsh-codex-pet/api/state`);
    const state = { pet: { id: 'codex', name: 'Codex', description: '', version: 2, source: 'builtin', url: '/dsh-codex-pet/asset/codex' }, config: { selected: 'codex', visible: true, size: 120, position: null }, activity: { pose: 'waiting', title: '桌面联动验证', text: '等待你处理', sessionId: 'smoke' } };
    state.notifications = { items: [{ id: 'smoke', token: '1:q', sessionId: 'smoke', pose: 'waiting', title: '桌面审批', text: '等待你处理', updatedAt: 1, request: { key: 'q', kind: 'approval', toolName: '终端', reason: '测试请求' } }], hidden: 0, activity: state.activity };
    await source.webContents.executeJavaScript(`window.dshDesktopPet.onCommand(async command => { window.lastPetCommand=command; if(command.type==='reject') throw new Error('测试拒绝结果'); }); window.dshDesktopPet.sync(${JSON.stringify(state)})`);
    const pet = BrowserWindow.getAllWindows().find(window => window !== source);
    assert.ok(pet, '创建独立原生窗口'); assert.equal(pet.isAlwaysOnTop(), true); assert.equal(pet.isResizable(), false);
    const status = await pet.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const deadline=Date.now()+5000;const poll=()=>{const el=document.querySelector('.dcp-pet-button');if(el)resolve({label:el.getAttribute('aria-label'),background:getComputedStyle(document.body).backgroundColor});else if(Date.now()>deadline)reject(new Error('宠物未渲染'));else setTimeout(poll,50)};poll()})`);
    assert.match(status.label, /Codex/); assert.equal(status.background, 'rgba(0, 0, 0, 0)');
    await pet.webContents.executeJavaScript(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    const image = await pet.webContents.capturePage();
    mkdirSync('docs/01-当前工作/I001-Codex宠物双端实现', { recursive: true });
    writeFileSync('docs/01-当前工作/I001-Codex宠物双端实现/06-桌面窗口.png', image.toPNG());
    await source.webContents.executeJavaScript(`window.dshDesktopPet.sync(${JSON.stringify({ ...state, config: { ...state.config, size: 224 } })})`);
    await pet.webContents.executeJavaScript(`new Promise(resolve=>setTimeout(resolve,100))`);
    const geometry = await pet.webContents.executeJavaScript(`(()=>{const pet=document.querySelector('.dcp-pet-button').getBoundingClientRect();const bubble=document.querySelector('.dcp-tray').getBoundingClientRect();return {petBottom:pet.bottom,bubbleTop:bubble.top,height:innerHeight};})()`);
    assert.ok(geometry.petBottom < geometry.height && geometry.bubbleTop >= 0, '最大宠物和气泡仍在窗口内');
    await assert.rejects(source.webContents.executeJavaScript(`window.dshDesktopPet.sync(${JSON.stringify({ ...state, pet: { ...state.pet, url: 'https://evil.test/pet.webp' } })})`));
    await pet.webContents.executeJavaScript(`window.petWindow.command({type:'approve',id:'smoke',token:'1:q',requestKey:'q'})`);
    assert.equal(await source.webContents.executeJavaScript('window.lastPetCommand.type'), 'approve');
    await assert.rejects(pet.webContents.executeJavaScript(`window.petWindow.command({type:'approve',id:'smoke',token:'old',requestKey:'q'})`));
    await assert.rejects(pet.webContents.executeJavaScript(`window.petWindow.command({type:'reject',id:'smoke',token:'1:q',requestKey:'q'})`));
    await source.webContents.executeJavaScript('window.dshDesktopPet.sync(null)');
    assert.equal(BrowserWindow.getAllWindows().length, 1);
    console.log('PASS：独立窗口、透明置顶、多会话命令回传、过期身份拒绝、错误回传、关闭清理');
  } finally { dispose(); source.destroy(); host.dispose(); server.close(); app.quit(); }
}).catch(error => { console.error(error); app.exit(1); });
