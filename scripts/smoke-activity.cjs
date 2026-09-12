// 隔离渲染真实客户端 bundle，用受控宿主快照验证气泡、图标和任务跳转。
const { chromium } = require("playwright");
const { build } = require("esbuild");
const { readFileSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");
const assert = require("node:assert/strict");
const smokeRoot = process.env.DSH_PET_SMOKE_DIR;
if (!smokeRoot)
  throw new Error("请通过 node scripts/run-smoke.cjs 运行冒烟测试。");
(async () => {
  const { createHost } = await import("../lib/index.js");
  const host = await createHost({
    dataRoot: resolve(smokeRoot, "activity-data"),
  });
  const server = require("node:http").createServer(
    (req, res) => void host.handler(req, res),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 800, height: 600 },
    });
    const prelude = await build({
      stdin: {
        contents: `import * as React from 'react'; import * as jsx from 'react/jsx-runtime'; import * as ReactDOM from 'react-dom'; import {createRoot} from 'react-dom/client';
      window.__ModuleLoader__={load({factory}){window.petPlugin=factory(id=>id==='react'?React:id==='react/jsx-runtime'?jsx:id==='react-dom'?ReactDOM:{createRoot});}};
      window.renderPet=Component=>createRoot(document.getElementById('root')).render(React.createElement(Component));`,
        resolveDir: process.cwd(),
      },
      bundle: true,
      write: false,
      format: "iife",
    });
    await page.goto(
      `http://127.0.0.1:${server.address().port}/dsh-codex-pet/api/state`,
    );
    await page.evaluate(
      `document.body.innerHTML='<button class="dcu-settings-link"><svg></svg><span>宠物</span></button><div id="root"></div>'; ${prelude.outputFiles[0].text}`,
    );
    await page.evaluate(readFileSync("lib/client.js", "utf8"));
    await page.evaluate(`
      const store=value=>({value,listeners:new Set(),getSnapshot(){return this.value},subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)},set(v){this.value=v;for(const fn of [...this.listeners])fn()}});
      window.live=store({running:false,lastAgentError:null});
      window.events=store({revision:0,change:{kind:'replace',entries:[]}});
      window.pending=store(new Map());
      window.petList=store({current:'smoke',ids:['smoke','background'],byId:{smoke:{id:'smoke',title:'受控测试任务',running:false},background:{id:'background',title:'后台会话',running:true}}});
      window.background={session:store({running:true,lastAgentError:null}),eventSource:store({revision:0,change:{kind:'replace',entries:[]}})};
      live.prompt=async parts=>{window.petSent=parts[0].text;return {ok:true}};
      const binding={session:live,eventSource:events};
      window.petLocale=store({active:'zh'});
      petPlugin.apply({locale:petLocale,sessions:{list:petList,binding:id=>id==='background'?background:binding,async create(){petList.set({...petList.value,ids:[...petList.value.ids,'new-task'],byId:{...petList.value.byId,'new-task':{id:'new-task',title:'新会话',running:false}}});return 'new-task'},open(id){window.openedPetSession=id}},uiSession:{pendingInteractions:pending},slots:{inject(name,fn){fn()},register(options,Component){if(options.name==='settings.section')window.petSection=options;if(options.name==='shell.overlay')renderPet(Component);return()=>{}}}});
    `);
    const waitFor = (condition) =>
      page.evaluate(
        `new Promise((resolve,reject)=>{const deadline=Date.now()+5000;const check=()=>{if(${condition})resolve(true);else if(Date.now()>deadline)reject(new Error('渲染超时'));else setTimeout(check,30)};check()})`,
      );
    await waitFor(
      `document.querySelector('.dcp-pet-button') && document.querySelector('[data-pet-icon="codex-paw"]')`,
    );
    await page.evaluate("live.set({running:true,lastAgentError:null})");
    await waitFor(
      `document.querySelector('.dcp-bubble-link')?.textContent.includes('正在工作')`,
    );
    await page.evaluate(
      `pending.set(new Map([['smoke',{kind:'approval',key:'approval-1',sessionId:'smoke',toolName:'终端',reason:'测试审批',answer:async value=>{window.petDecision=value;pending.set(new Map())}}]]))`,
    );
    await waitFor(
      `document.querySelector('.dcp-bubble-link')?.textContent.includes('等待你处理')`,
    );
    await page.evaluate(`document.querySelector('.dcp-bubble-link').click()`);
    assert.equal(await page.evaluate("window.openedPetSession"), "smoke");
    await page.evaluate(
      `document.querySelector('button[title="查看并处理"]').click()`,
    );
    await waitFor(
      `Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='仅允许一次')`,
    );
    await page.evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='仅允许一次').click()`,
    );
    await waitFor(`window.petDecision==='allowed-once'`);
    assert.equal(
      await page.evaluate(
        `document.querySelectorAll('[role="listitem"]').length`,
      ),
      2,
    );
    await page.evaluate(
      `pending.set(new Map());events.set({revision:1,change:{kind:'append',entries:[{type:'event',event:{type:'turn/end',data:{reason:{kind:'completed'}}}}]}});live.set({running:false,lastAgentError:null})`,
    );
    await waitFor(
      `document.querySelector('.dcp-bubble-link')?.textContent.includes('已完成')`,
    );
    await page.evaluate(
      `pending.set(new Map([['smoke',{kind:'plan-review',key:'plan-2',sessionId:'smoke',questions:[{id:'plan',question:'是否实施计划？',detail:'先检查，再修改。',options:[{label:'实施计划'},{label:'先修改'}]}],answer:async value=>{window.petAnswer=value;pending.set(new Map())}}]]))`,
    );
    await waitFor(
      `document.querySelector('.dcp-bubble-link')?.textContent.includes('等待你处理')`,
    );
    await page.evaluate(
      `document.querySelector('button[title="查看并处理"]').click()`,
    );
    await waitFor(`document.querySelector('input[type="radio"]')`);
    await page.evaluate(
      `document.querySelector('input[type="radio"]').click()`,
    );
    await page.evaluate(
      `document.querySelector('.dcp-request form').requestSubmit()`,
    );
    await waitFor(`window.petAnswer?.answers[0].selected[0]==='实施计划'`);
    assert.equal(
      await page.evaluate(
        `document.querySelector('select,textarea[aria-label="给会话发送消息"]') === null`,
      ),
      true,
      "通知面板不提供额外聊天入口",
    );
    const rect = await page.evaluate(
      `(()=>{const r=document.querySelector('.dcp-tray').getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight}})()`,
    );
    assert.ok(
      rect.top >= 0 &&
        rect.left >= 0 &&
        rect.right <= rect.w &&
        rect.bottom <= rect.h,
      "通知面板在视口内",
    );
    await new Promise((resolve) => setTimeout(resolve, 350));
    console.log("交互与视口断言通过，捕获截图");
    writeFileSync(
      resolve(smokeRoot, "18-气泡视觉优化.png"),
      await page.screenshot(),
    );
    await page.setViewportSize({ width: 441, height: 376 });
    await page.evaluate(
      `petList.set({current:'background',ids:['background'],byId:{background:{id:'background',title:'代码评审会话标题',running:true}}})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 350));
    const actions = await page.evaluate(
      `Array.from(document.querySelectorAll('.dcp-notice-action')).map(b=>({height:b.getBoundingClientRect().height,font:getComputedStyle(b).fontSize}))`,
    );
    assert.equal(actions.length, 2);
    assert.deepEqual(actions[0], actions[1]);
    writeFileSync(
      resolve(smokeRoot, "21-Codex胶囊气泡.png"),
      await page.screenshot(),
    );
    await page.evaluate(
      `document.querySelector('.dcp-floating').classList.add('dcp-light');document.body.style.background='#f6f6f6'`,
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    writeFileSync(
      resolve(smokeRoot, "22-Codex浅色胶囊.png"),
      await page.screenshot(),
    );
    await page.evaluate(
      `document.querySelectorAll('button[aria-label^="关闭通知："]').forEach(button=>button.click())`,
    );
    await waitFor(
      `!document.querySelector('.dcp-tray') && !!document.querySelector('.dcp-pet-button')`,
    );
    await page.evaluate(
      `document.querySelector('.dcp-pet-button').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))`,
    );
    await waitFor(
      `Array.from(document.querySelectorAll('[role="menuitem"]')).some(button=>button.textContent==='恢复已关闭通知')`,
    );
    await page.evaluate(
      `Array.from(document.querySelectorAll('[role="menuitem"]')).find(button=>button.textContent==='恢复已关闭通知').click()`,
    );
    await waitFor(`!!document.querySelector('.dcp-tray')`);
    await page.evaluate(`petList.set({current:undefined,ids:[],byId:{}})`);
    await waitFor(
      `!document.querySelector('.dcp-tray') && !!document.querySelector('.dcp-pet-button')`,
    );
    await page.evaluate(`window.dispatchEvent(new Event('dcp-open-settings'))`);
    await waitFor(
      `document.querySelector('dialog[aria-label="宠物设置"]')?.open`,
    );
    await waitFor(
      `document.querySelector('.dcp-page')?.textContent.includes('露露')`,
    );
    await page.evaluate(`petLocale.set({active:'en'})`);
    await waitFor(
      `document.querySelector('.dcp-page')?.textContent.includes('A calm companion for focused workspace days.')`,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.dcp-page').textContent.includes('露露')`,
      ),
      false,
    );
    assert.equal(await page.evaluate(`petSection.label()`), "Pets");
    await waitFor(
      `document.querySelector('.dcp-head h2')?.textContent==='Choose a pet' && document.querySelector('.mpi-check')?.textContent==='Check for updates'`,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.dcp-folder-button').textContent.trim()`,
      ),
      "Open folder",
    );
    await page.setViewportSize({ width: 1000, height: 1100 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    writeFileSync(
      resolve(smokeRoot, "pet-settings-en.png"),
      await page.screenshot(),
    );
    await page.evaluate(`document.querySelector('.mpi-check').click()`);
    await waitFor(
      `document.querySelector('.mpi-dialog h2')?.textContent.includes('Pets')`,
    );
    await page.evaluate(`document.querySelector('.mpi-dialog-close').click()`);

    assert.equal(
      await page.evaluate(
        `document.querySelector('textarea[aria-label="Pet description"]')!==null`,
      ),
      true,
    );
    await page.evaluate(
      `petList.set({current:'english',ids:['english'],byId:{english:{id:'english',title:'用户标题保持原文',running:true}}});live.set({running:true,lastAgentError:null})`,
    );
    await waitFor(
      `document.querySelector('.dcp-bubble-link')?.textContent.includes('Working')`,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.dcp-bubble-link strong').textContent`,
      ),
      "用户标题保持原文",
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('button[title="Stop current turn"]')!==null`,
      ),
      true,
    );
    await page.evaluate(
      `document.querySelector('.dcp-pet-button').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))`,
    );
    await waitFor(
      `Array.from(document.querySelectorAll('[role="menuitem"]')).some(b=>b.textContent==='Pet settings')`,
    );
    await page.evaluate(
      `document.querySelector('.dcp-pet-button').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));petList.set({ids:[],byId:{}})`,
    );
    await page.evaluate(`petLocale.set({active:'zh-CN'})`);
    await waitFor(
      `document.querySelector('.dcp-page')?.textContent.includes('露露')`,
    );
    await page.setViewportSize({ width: 1000, height: 1100 });
    await new Promise((resolve) => setTimeout(resolve, 250));
    writeFileSync(
      resolve(smokeRoot, "pet-i18n-zh.png"),
      await page.screenshot(),
    );
    assert.equal(
      await page.evaluate(`document.querySelector('.dcp-version').textContent`),
      "v" + JSON.parse(readFileSync("package.json", "utf8")).version,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.dcp-project-links a').href`,
      ),
      "https://github.com/MichengAI/dsh-codex-pet",
    );
    // 仅拦截隔离窗口的更新响应，不调用真实安装器。
    await page.evaluate(
      `window.updateMode='unpublished';window.originalPetFetch=window.fetch;window.fetch=async (url,options)=>String(url).endsWith('/api/update')?Response.json({packageName:'@michengai/dsh-codex-pet',currentVersion:'0.1.0',latestVersion:updateMode==='unpublished'?undefined:'0.2.0',notPublished:updateMode==='unpublished',latestCheckFailed:false,updateAvailable:updateMode!=='unpublished',profileName:'smoke',canAutoUpdate:true,...(options?.method==='POST'?{updatedVersion:'0.2.0',autoReload:false}:{})}):originalPetFetch(url,options);document.querySelector('.dcp-project-links button').click()`,
    );
    await waitFor(
      `document.querySelector('.mpi-status')?.textContent.includes('尚未发布到 npm')`,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.mpi-dialog .mpi-primary').disabled`,
      ),
      true,
    );
    await page.evaluate(
      `window.updateMode='available';Array.from(document.querySelectorAll('.mpi-dialog footer button')).find(b=>b.textContent==='重新检查').click()`,
    );
    await waitFor(
      `document.querySelector('.mpi-status')?.textContent.includes('发现新版本')`,
    );
    await new Promise((resolve) => setTimeout(resolve, 250));
    writeFileSync(
      resolve(smokeRoot, "pet-update-dialog.png"),
      await page.screenshot(),
    );
    await page.evaluate(
      `document.querySelector('.mpi-dialog .mpi-primary').click()`,
    );
    await waitFor(
      `document.querySelector('.mpi-status')?.textContent.includes('更新完成')`,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.mpi-dialog .mpi-primary').disabled`,
      ),
      true,
    );
    await page.evaluate(
      `document.querySelector('.mpi-dialog-close').click();window.fetch=window.originalPetFetch;document.querySelector('dialog[aria-label="宠物设置"]').close()`,
    );
    // 后端仍携带兼容中文 error，英文弹窗必须优先按 code 翻译。
    await page.evaluate(
      `petLocale.set({active:'en'});window.dispatchEvent(new Event('dcp-open-settings'));window.fetch=async(url,options)=>String(url).endsWith('/api/update')?(options?.method==='POST'?Response.json({code:'UPDATE_TIMEOUT',error:'更新超时，已请求取消；进程结束前不能再次安装。'},{status:503}):Response.json({packageName:'@michengai/dsh-codex-pet',currentVersion:'0.1.0',latestVersion:'0.2.0',notPublished:false,latestCheckFailed:false,updateAvailable:true,profileName:'smoke',canAutoUpdate:true})):originalPetFetch(url,options);void 0`,
    );
    await waitFor(
      `document.querySelector('.mpi-check')?.textContent==='Check for updates'`,
    );
    await page.evaluate(`document.querySelector('.mpi-check').click()`);
    await waitFor(
      `document.querySelector('.mpi-dialog .mpi-primary')?.disabled===false`,
    );
    await page.evaluate(
      `document.querySelector('.mpi-dialog .mpi-primary').click()`,
    );
    await waitFor(
      `document.querySelector('.mpi-status')?.textContent.includes('timed out')`,
    );
    assert.equal(
      await page.evaluate(
        `document.querySelector('.mpi-status').textContent.includes('更新超时')`,
      ),
      false,
    );
    writeFileSync(
      resolve(smokeRoot, "pet-update-error-en.png"),
      await page.screenshot(),
    );
    await page.evaluate(
      `document.querySelector('.mpi-dialog-close').click();window.fetch=originalPetFetch;document.querySelector('dialog[aria-label="Pet settings"]').close();petLocale.set({active:'zh'})`,
    );
    // 消费者通过插件公开接口读取状态与发出命令，插件无需认识消费者。
    await page.evaluate(
      `window.petApi=window.dshPet;window.petChanges=0;window.offPet=petApi.subscribe(()=>petChanges++);window.releasePet=petApi.acquireDisplay();void 0`,
    );
    await waitFor(`!document.querySelector('.dcp-pet-button')`);
    await page.evaluate(
      `releasePet();petList.set({current:'consumer',ids:['consumer'],byId:{consumer:{id:'consumer',title:'公开接口任务',running:true}}});live.set({running:true,lastAgentError:null});void 0`,
    );
    await waitFor(
      `document.querySelector('.dcp-pet-button') && petApi.getSnapshot()?.notifications.items[0]?.id==='consumer'`,
    );
    await page.evaluate(
      `petApi.command({type:'open',id:'consumer',token:petApi.getSnapshot().notifications.items[0].token})`,
    );
    assert.equal(await page.evaluate("window.openedPetSession"), "consumer");
    const changes = await page.evaluate("petChanges");
    await new Promise((resolve) => setTimeout(resolve, 2800));
    assert.equal(
      await page.evaluate("petChanges"),
      changes,
      "状态不变不重复通知消费者",
    );
    await page.evaluate(`offPet();void 0`);
    console.log(
      "PASS：实际客户端多会话展开、审批及计划回答回传、完成保留、任务跳转、视口边界、空通知隐藏与菜单恢复",
    );
  } finally {
    try {
      await browser?.close();
    } finally {
      host.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
