window.__ModuleLoader__.load({id:"@michengai/dsh-codex-pet",factory:function(require){var module={exports:{}};var exports=module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);

// src/session-compat.ts
var DEFAULT_OWNER = "pet";
function compatibleSessions(sessions, navigate, status) {
  const held = /* @__PURE__ */ new Map();
  const drop = (id) => {
    const entry = held.get(id);
    if (entry === void 0) return;
    try {
      entry.ref.release();
    } catch {
    }
    held.delete(id);
  };
  const sweep = () => {
    if (held.size === 0) return;
    const ids = new Set(sessions.list?.getSnapshot?.()?.ids ?? []);
    for (const id of [...held.keys()]) if (!ids.has(id)) drop(id);
  };
  const releaseBindings = (owner = DEFAULT_OWNER) => {
    for (const [id, entry] of [...held]) {
      entry.owners.delete(owner);
      if (entry.owners.size === 0) drop(id);
    }
  };
  function releaseBinding(id, owner = DEFAULT_OWNER) {
    const entry = held.get(id);
    if (entry === void 0) return;
    entry.owners.delete(owner);
    if (entry.owners.size === 0) drop(id);
  }
  sessions.list?.subscribe?.(sweep);
  return {
    list: sessions.list,
    status: status ?? sessions.status,
    using: sessions.using?.bind(sessions),
    open: navigate,
    releaseBinding,
    releaseBindings,
    sweepBindings: sweep,
    create: (options) => {
      if (!sessions.create) throw new Error("\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5");
      return sessions.create(options);
    },
    binding(id, owner = DEFAULT_OWNER) {
      let binding = sessions.binding(id);
      if (!binding && sessions.retain) {
        let entry = held.get(id);
        if (!entry) {
          try {
            entry = { ref: sessions.retain(id, { source: "controllerOperation" }), owners: /* @__PURE__ */ new Set() };
            held.set(id, entry);
          } catch {
            return void 0;
          }
        }
        entry.owners.add(owner);
        binding = entry.ref.binding;
      }
      return binding;
    }
  };
}

// src/pending-status.ts
function pendingFromSessionStatus(status) {
  return {
    getSnapshot() {
      const next = /* @__PURE__ */ new Map();
      for (const [id, row] of status.getSnapshot()) {
        const wait = row.pendingInteraction;
        if (!wait || typeof wait !== "object") continue;
        const item = wait;
        next.set(String(id), {
          kind: item.kind,
          key: item.key,
          sessionId: item.sessionId ?? String(id),
          toolName: item.toolName,
          reason: item.reason,
          questions: item.questions,
          answer: typeof item.answer === "function" ? item.answer.bind(item) : void 0
        });
      }
      return next;
    },
    subscribe: (listener) => status.subscribe(listener)
  };
}

// src/companion-api.ts
function createCompanionProvider(handlers) {
  let snapshot = null, active = true, displays = 0, signature = "null";
  const listeners = /* @__PURE__ */ new Set();
  const check = () => {
    if (!active) throw new Error("\u5BA0\u7269\u63A5\u53E3\u5DF2\u5378\u8F7D");
  };
  const publish = (value) => {
    const next = JSON.stringify(value);
    if (next === signature) return;
    signature = next;
    snapshot = structuredClone(value);
    for (const listener of listeners) {
      try {
        listener(structuredClone(snapshot));
      } catch (error) {
        console.error("\u5BA0\u7269\u72B6\u6001\u8BA2\u9605\u5931\u8D25", error);
      }
    }
  };
  const api = Object.freeze({
    version: 1,
    getSnapshot: () => structuredClone(snapshot),
    subscribe(listener) {
      check();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async command(value) {
      check();
      await handlers.command(value);
    },
    async updateConfig(value) {
      check();
      await handlers.updateConfig(value);
    },
    openSettings() {
      check();
      handlers.openSettings();
    },
    acquireDisplay() {
      check();
      displays++;
      handlers.externalDisplay(true);
      let released = false;
      return () => {
        if (released || !active) return;
        released = true;
        displays--;
        handlers.externalDisplay(displays > 0);
      };
    }
  });
  return { api, publish(value) {
    check();
    publish(value);
  }, dispose() {
    if (!active) return;
    active = false;
    publish(null);
    listeners.clear();
    handlers.externalDisplay(false);
  } };
}

// src/locales/zh.ts
var zh = {
  "\u5BA0\u7269": "\u5BA0\u7269",
  "\u5BA0\u7269\u8BBE\u7F6E": "\u5BA0\u7269\u8BBE\u7F6E",
  "\u5173\u95ED\u8BBE\u7F6E": "\u5173\u95ED\u8BBE\u7F6E",
  "\u9009\u62E9\u5BA0\u7269": "\u9009\u62E9\u5BA0\u7269",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "\u5237\u65B0\u5BA0\u7269\u5E93",
  "\u521B\u5EFA": "\u521B\u5EFA",
  "\u663E\u793A\u5BA0\u7269": "\u663E\u793A\u5BA0\u7269",
  "\u6536\u8D77\u5BA0\u7269": "\u6536\u8D77\u5BA0\u7269",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026",
  "\u5DF2\u9009": "\u5DF2\u9009",
  "\u9009\u62E9": "\u9009\u62E9",
  "\u5DF2\u9009\u62E9": "\u5DF2\u9009\u62E9",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "\u6253\u5F00\u6587\u4EF6\u5939",
  "\u5916\u89C2": "\u5916\u89C2",
  "\u5BA0\u7269\u5927\u5C0F": "\u5BA0\u7269\u5927\u5C0F",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F",
  "\u521B\u5EFA\u5BA0\u7269": "\u521B\u5EFA\u5BA0\u7269",
  "\u5BA0\u7269\u63CF\u8FF0": "\u5BA0\u7269\u63CF\u8FF0",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002",
  "\u53D6\u6D88": "\u53D6\u6D88",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "\u5728 DSH \u4E2D\u521B\u5EFA",
  "\u521B\u5EFA\u5931\u8D25": "\u521B\u5EFA\u5931\u8D25",
  "\u64CD\u4F5C\u5931\u8D25": "\u64CD\u4F5C\u5931\u8D25",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "\u6253\u5F00\u5173\u8054\u4EFB\u52A1",
  "\u7A7A\u95F2": "\u7A7A\u95F2",
  "\u6253\u4E2A\u62DB\u547C": "\u6253\u4E2A\u62DB\u547C",
  "\u8DF3\u4E00\u8DF3": "\u8DF3\u4E00\u8DF3",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5",
  "\u6062\u590D\u5931\u8D25": "\u6062\u590D\u5931\u8D25",
  "\u67E5\u770B\u4EFB\u52A1": "\u67E5\u770B\u4EFB\u52A1",
  "\u63D0\u4EA4\u5931\u8D25": "\u63D0\u4EA4\u5931\u8D25",
  "\u5DE5\u5177\u5BA1\u6279": "\u5DE5\u5177\u5BA1\u6279",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002",
  "\u62D2\u7EDD": "\u62D2\u7EDD",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "\u4EC5\u5141\u8BB8\u4E00\u6B21",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E",
  "\u63D0\u4EA4\u56DE\u7B54": "\u63D0\u4EA4\u56DE\u7B54",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5",
  "\u6536\u8D77\u4F1A\u8BDD": "\u6536\u8D77\u4F1A\u8BDD",
  "\u5C55\u5F00\u4F1A\u8BDD": "\u5C55\u5F00\u4F1A\u8BDD",
  "\u4F1A\u8BDD": "\u4F1A\u8BDD",
  "\u6700\u65B0\u4F18\u5148": "\u6700\u65B0\u4F18\u5148",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C",
  "\u67E5\u770B\u5E76\u5904\u7406": "\u67E5\u770B\u5E76\u5904\u7406",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21",
  "\u6B63\u5728\u5DE5\u4F5C": "\u6B63\u5728\u5DE5\u4F5C",
  "\u7B49\u5F85\u4F60\u5904\u7406": "\u7B49\u5F85\u4F60\u5904\u7406",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "\u4EFB\u52A1\u51FA\u9519\u4E86",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B",
  "\u5F53\u524D\u4EFB\u52A1": "\u5F53\u524D\u4EFB\u52A1",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "\u5173\u95ED\u901A\u77E5\uFF1A{title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "\u5904\u7406\u8BF7\u6C42\uFF1A{title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}\uFF1A\u6587\u5B57\u56DE\u7B54",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54",
  "\u9009\u9879\u65E0\u6548": "\u9009\u9879\u65E0\u6548",
  "\u56DE\u7B54\u8FC7\u957F": "\u56DE\u7B54\u8FC7\u957F",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C",
  "\u505C\u6B62\u5931\u8D25": "\u505C\u6B62\u5931\u8D25",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42",
  "\u9879\u76EE\u94FE\u63A5": "\u9879\u76EE\u94FE\u63A5",
  "\u95EE\u9898\u53CD\u9988": "\u95EE\u9898\u53CD\u9988",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5"
};

// src/locales/en.ts
var en = {
  "\u5BA0\u7269": "Pets",
  "\u5BA0\u7269\u8BBE\u7F6E": "Pet settings",
  "\u5173\u95ED\u8BBE\u7F6E": "Close settings",
  "\u9009\u62E9\u5BA0\u7269": "Choose a pet",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "Your pet follows conversations and highlights what needs your attention.",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "Refresh pet library",
  "\u521B\u5EFA": "Create",
  "\u663E\u793A\u5BA0\u7269": "Show pet",
  "\u6536\u8D77\u5BA0\u7269": "Hide pet",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "Loading pets\u2026",
  "\u5DF2\u9009": "Selected",
  "\u9009\u62E9": "Select",
  "\u5DF2\u9009\u62E9": "Selected",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "No pets loaded. Built-in assets are missing; reinstall the complete plugin.",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "DSH custom pets",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "Loading folder\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "Open folder",
  "\u5916\u89C2": "Appearance",
  "\u5BA0\u7269\u5927\u5C0F": "Pet size",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "Adjust the size of your pet",
  "\u521B\u5EFA\u5BA0\u7269": "Create a pet",
  "\u5BA0\u7269\u63CF\u8FF0": "Pet description",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "For example: a quiet, curious sea otter wearing round glasses, in a plush toy style\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "Create in a new DSH conversation using the bundled Skill. The result is saved to the DSH pet folder. An image generation tool is required in that conversation.",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "Start creation from pet settings in DSH. The standalone view has no conversation service.",
  "\u53D6\u6D88": "Cancel",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "Create in DSH",
  "\u521B\u5EFA\u5931\u8D25": "Creation failed",
  "\u64CD\u4F5C\u5931\u8D25": "Operation failed",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "Pet service is unavailable",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "Open linked task",
  "\u7A7A\u95F2": "Idle",
  "\u6253\u4E2A\u62DB\u547C": "Wave",
  "\u8DF3\u4E00\u8DF3": "Jump",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "Restore dismissed notifications",
  "\u6062\u590D\u5931\u8D25": "Restore failed",
  "\u67E5\u770B\u4EFB\u52A1": "View task",
  "\u63D0\u4EA4\u5931\u8D25": "Submission failed",
  "\u5DE5\u5177\u5BA1\u6279": "Tool approval",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "This tool needs your approval.",
  "\u62D2\u7EDD": "Reject",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "Allow once",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "Enter an answer or additional details",
  "\u63D0\u4EA4\u56DE\u7B54": "Submit answer",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "Open the conversation to handle this request.",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "Pet conversation notifications",
  "\u6536\u8D77\u4F1A\u8BDD": "Collapse conversations",
  "\u5C55\u5F00\u4F1A\u8BDD": "Expand conversations",
  "\u4F1A\u8BDD": "Conversations",
  "\u6700\u65B0\u4F18\u5148": "Newest first",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "Latest activity first",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "Needs attention first",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "Dismiss this turn\u2019s notification; the task keeps running",
  "\u67E5\u770B\u5E76\u5904\u7406": "View and respond",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "Open conversation to reply",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "Stop current turn",
  "\u6B63\u5728\u5DE5\u4F5C": "Working",
  "\u7B49\u5F85\u4F60\u5904\u7406": "Waiting for you",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "Task failed",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "Completed, ready for review",
  "\u5F53\u524D\u4EFB\u52A1": "Current task",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "{count} pet resources need attention",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "{count} more conversations",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restore {count} dismissed notifications",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "Dismiss notification: {title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "Respond to request: {title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "Reply to conversation: {title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "Stop current turn: {title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}: written answer",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}, {status}; drag to move, double-click to jump, right-click for menu",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "Conversation service is not ready",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "Pet library has not loaded",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "Please answer every question",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "The questions have changed. Please answer again.",
  "\u9009\u9879\u65E0\u6548": "Invalid option",
  "\u56DE\u7B54\u8FC7\u957F": "Answer is too long",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "Choose one option or enter one written answer",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "This notification has changed. Use the latest notification.",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "Task state has changed",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "The host does not support stopping tasks",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "Submitting. Please do not repeat the action.",
  "\u505C\u6B62\u5931\u8D25": "Could not stop the task",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "The request has ended or changed. Open the latest conversation.",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "This request has already been submitted",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "This action is not supported for this request",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "Enter a pet description of 1\u20132000 characters",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "The new conversation is not ready. Please try again.",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH did not accept the pet creation request",
  "\u9879\u76EE\u94FE\u63A5": "Project links",
  "\u95EE\u9898\u53CD\u9988": "Issues",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "1 pet resource needs attention",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "1 more conversation",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restore 1 dismissed notification"
};

// src/locales/ja.ts
var ja = {
  "\u5BA0\u7269": "\u30DA\u30C3\u30C8",
  "\u5BA0\u7269\u8BBE\u7F6E": "\u30DA\u30C3\u30C8\u8A2D\u5B9A",
  "\u5173\u95ED\u8BBE\u7F6E": "\u8A2D\u5B9A\u3092\u9589\u3058\u308B",
  "\u9009\u62E9\u5BA0\u7269": "\u30DA\u30C3\u30C8\u3092\u9078\u629E",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "\u30DA\u30C3\u30C8\u304C\u4F1A\u8A71\u30B9\u30EC\u30C3\u30C9\u3092\u898B\u5B88\u308A\u3001\u5BFE\u5FDC\u304C\u5FC5\u8981\u306A\u4E8B\u9805\u3092\u5206\u304B\u308A\u3084\u3059\u304F\u4F1D\u3048\u307E\u3059\u3002",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "\u30DA\u30C3\u30C8\u30E9\u30A4\u30D6\u30E9\u30EA\u3092\u66F4\u65B0",
  "\u521B\u5EFA": "\u4F5C\u6210",
  "\u663E\u793A\u5BA0\u7269": "\u30DA\u30C3\u30C8\u3092\u8868\u793A",
  "\u6536\u8D77\u5BA0\u7269": "\u30DA\u30C3\u30C8\u3092\u96A0\u3059",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "\u30DA\u30C3\u30C8\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
  "\u5DF2\u9009": "\u9078\u629E\u4E2D",
  "\u9009\u62E9": "\u9078\u629E",
  "\u5DF2\u9009\u62E9": "\u9078\u629E\u6E08\u307F",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "\u30DA\u30C3\u30C8\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u7D44\u307F\u8FBC\u307F\u30A2\u30BB\u30C3\u30C8\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\u3002\u30D7\u30E9\u30B0\u30A4\u30F3\u3092\u518D\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "DSH \u30AB\u30B9\u30BF\u30E0\u30DA\u30C3\u30C8",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "\u30D5\u30A9\u30EB\u30C0\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "\u30D5\u30A9\u30EB\u30C0\u3092\u958B\u304F",
  "\u5916\u89C2": "\u5916\u89B3",
  "\u5BA0\u7269\u5927\u5C0F": "\u30DA\u30C3\u30C8\u306E\u30B5\u30A4\u30BA",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "\u30DA\u30C3\u30C8\u306E\u8868\u793A\u30B5\u30A4\u30BA\u3092\u8ABF\u6574",
  "\u521B\u5EFA\u5BA0\u7269": "\u30DA\u30C3\u30C8\u3092\u4F5C\u6210",
  "\u5BA0\u7269\u63CF\u8FF0": "\u30DA\u30C3\u30C8\u306E\u8AAC\u660E",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "\u4F8B\uFF1A\u4E38\u30E1\u30AC\u30CD\u3092\u304B\u3051\u305F\u5C0F\u3055\u306A\u30E9\u30C3\u30B3\u3001\u7269\u9759\u304B\u3067\u597D\u5947\u5FC3\u65FA\u76DB\u3001\u306C\u3044\u3050\u308B\u307F\u98A8\u30B9\u30BF\u30A4\u30EB\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "\u30D7\u30E9\u30B0\u30A4\u30F3\u4ED8\u5C5E\u306E Skill \u3092\u4F7F\u7528\u3057\u3066 DSH \u306E\u65B0\u3057\u3044\u4F1A\u8A71\u3067\u4F5C\u6210\u3057\u3001\u5B8C\u6210\u54C1\u306F DSH \u30DA\u30C3\u30C8\u30D5\u30A9\u30EB\u30C0\u306B\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002\u4F1A\u8A71\u5185\u3067\u753B\u50CF\u751F\u6210\u30C4\u30FC\u30EB\u304C\u5229\u7528\u53EF\u80FD\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "DSH \u30E1\u30A4\u30F3\u753B\u9762\u306E\u30DA\u30C3\u30C8\u8A2D\u5B9A\u304B\u3089\u4F5C\u6210\u3092\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u5358\u72EC\u30D7\u30EC\u30D3\u30E5\u30FC\u3067\u306F\u4F1A\u8A71\u30B5\u30FC\u30D3\u30B9\u3092\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002",
  "\u53D6\u6D88": "\u30AD\u30E3\u30F3\u30BB\u30EB",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "DSH \u3067\u4F5C\u6210",
  "\u521B\u5EFA\u5931\u8D25": "\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
  "\u64CD\u4F5C\u5931\u8D25": "\u64CD\u4F5C\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "\u30DA\u30C3\u30C8\u30B5\u30FC\u30D3\u30B9\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "\u95A2\u9023\u30BF\u30B9\u30AF\u3092\u958B\u304F",
  "\u7A7A\u95F2": "\u5F85\u6A5F\u4E2D",
  "\u6253\u4E2A\u62DB\u547C": "\u624B\u3092\u632F\u308B",
  "\u8DF3\u4E00\u8DF3": "\u30B8\u30E3\u30F3\u30D7",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "\u9589\u3058\u305F\u901A\u77E5\u3092\u5FA9\u5143",
  "\u6062\u590D\u5931\u8D25": "\u5FA9\u5143\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
  "\u67E5\u770B\u4EFB\u52A1": "\u30BF\u30B9\u30AF\u3092\u8868\u793A",
  "\u63D0\u4EA4\u5931\u8D25": "\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
  "\u5DE5\u5177\u5BA1\u6279": "\u30C4\u30FC\u30EB\u306E\u627F\u8A8D",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "\u3053\u306E\u30C4\u30FC\u30EB\u306B\u306F\u3042\u306A\u305F\u306E\u627F\u8A8D\u304C\u5FC5\u8981\u3067\u3059\u3002",
  "\u62D2\u7EDD": "\u62D2\u5426",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "1\u56DE\u306E\u307F\u8A31\u53EF",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "\u56DE\u7B54\u307E\u305F\u306F\u88DC\u8DB3\u8AAC\u660E\u3092\u5165\u529B",
  "\u63D0\u4EA4\u56DE\u7B54": "\u56DE\u7B54\u3092\u9001\u4FE1",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "\u4F1A\u8A71\u3092\u958B\u3044\u3066\u3053\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u5BFE\u5FDC\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "\u30DA\u30C3\u30C8\u4F1A\u8A71\u901A\u77E5",
  "\u6536\u8D77\u4F1A\u8BDD": "\u4F1A\u8A71\u3092\u6298\u308A\u305F\u305F\u3080",
  "\u5C55\u5F00\u4F1A\u8BDD": "\u4F1A\u8A71\u3092\u5C55\u958B",
  "\u4F1A\u8BDD": "\u4F1A\u8A71",
  "\u6700\u65B0\u4F18\u5148": "\u6700\u65B0\u512A\u5148",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "\u6700\u65B0\u306E\u30A2\u30AF\u30C6\u30A3\u30D3\u30C6\u30A3\u512A\u5148",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "\u5BFE\u5FDC\u304C\u5FC5\u8981\u306A\u4E8B\u9805\u512A\u5148",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "\u3053\u306E\u30BF\u30FC\u30F3\u306E\u901A\u77E5\u3092\u9589\u3058\u307E\u3059\uFF08\u30BF\u30B9\u30AF\u306F\u7D99\u7D9A\u3057\u3066\u5B9F\u884C\u3055\u308C\u307E\u3059\uFF09",
  "\u67E5\u770B\u5E76\u5904\u7406": "\u78BA\u8A8D\u3057\u3066\u5BFE\u5FDC",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "\u4F1A\u8A71\u3092\u958B\u3044\u3066\u8FD4\u4FE1",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "\u73FE\u5728\u306E\u30BF\u30FC\u30F3\u3092\u505C\u6B62",
  "\u6B63\u5728\u5DE5\u4F5C": "\u4F5C\u696D\u4E2D",
  "\u7B49\u5F85\u4F60\u5904\u7406": "\u5BFE\u5FDC\u5F85\u3061",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "\u30BF\u30B9\u30AF\u3067\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "\u5B8C\u4E86\u3001\u78BA\u8A8D\u5F85\u3061",
  "\u5F53\u524D\u4EFB\u52A1": "\u73FE\u5728\u306E\u30BF\u30B9\u30AF",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "{count} \u4EF6\u306E\u30DA\u30C3\u30C8\u30EA\u30BD\u30FC\u30B9\u306E\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "\u4ED6 {count} \u4EF6\u306E\u4F1A\u8A71",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "\u9589\u3058\u305F\u901A\u77E5 {count} \u4EF6\u3092\u5FA9\u5143",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "\u901A\u77E5\u3092\u9589\u3058\u308B\uFF1A{title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u51E6\u7406\uFF1A{title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "\u4F1A\u8A71\u306B\u8FD4\u4FE1\uFF1A{title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "\u73FE\u5728\u306E\u30BF\u30FC\u30F3\u3092\u505C\u6B62\uFF1A{title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}\uFF1A\u30C6\u30AD\u30B9\u30C8\u56DE\u7B54",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}\u3001{status}\uFF1B\u30C9\u30E9\u30C3\u30B0\u3067\u79FB\u52D5\u3001\u30C0\u30D6\u30EB\u30AF\u30EA\u30C3\u30AF\u3067\u30B8\u30E3\u30F3\u30D7\u3001\u53F3\u30AF\u30EA\u30C3\u30AF\u3067\u30E1\u30CB\u30E5\u30FC",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "\u4F1A\u8A71\u30B5\u30FC\u30D3\u30B9\u306F\u307E\u3060\u6E96\u5099\u304C\u3067\u304D\u3066\u3044\u307E\u305B\u3093",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "\u30DA\u30C3\u30C8\u30E9\u30A4\u30D6\u30E9\u30EA\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "\u3059\u3079\u3066\u306E\u8CEA\u554F\u306B\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "\u8CEA\u554F\u304C\u5909\u66F4\u3055\u308C\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "\u9009\u9879\u65E0\u6548": "\u7121\u52B9\u306A\u9078\u629E\u80A2\u3067\u3059",
  "\u56DE\u7B54\u8FC7\u957F": "\u56DE\u7B54\u304C\u9577\u3059\u304E\u307E\u3059",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "\u5358\u4E00\u9078\u629E\u306E\u8CEA\u554F\u306B\u306F1\u3064\u306E\u56DE\u7B54\u306E\u307F\u9001\u4FE1\u3067\u304D\u307E\u3059",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "\u3053\u306E\u901A\u77E5\u306F\u66F4\u65B0\u3055\u308C\u307E\u3057\u305F\u3002\u6700\u65B0\u306E\u901A\u77E5\u3092\u4F7F\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "\u30BF\u30B9\u30AF\u306E\u72B6\u614B\u304C\u5909\u5316\u3057\u307E\u3057\u305F",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "\u30DB\u30B9\u30C8\u306F\u30BF\u30B9\u30AF\u505C\u6B62\u6A5F\u80FD\u3092\u5099\u3048\u3066\u3044\u307E\u305B\u3093",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "\u9001\u4FE1\u4E2D\u3067\u3059\u3002\u91CD\u8907\u3057\u3066\u64CD\u4F5C\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044\u3002",
  "\u505C\u6B62\u5931\u8D25": "\u505C\u6B62\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "\u30EA\u30AF\u30A8\u30B9\u30C8\u304C\u7D42\u4E86\u307E\u305F\u306F\u5909\u66F4\u3055\u308C\u307E\u3057\u305F\u3002\u6700\u65B0\u306E\u4F1A\u8A71\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "\u3053\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u306F\u65E2\u306B\u9001\u4FE1\u3055\u308C\u3066\u3044\u307E\u3059",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "\u3053\u306E\u64CD\u4F5C\u306F\u3053\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u3067\u306F\u30B5\u30DD\u30FC\u30C8\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "1\u301C2000\u6587\u5B57\u306E\u30DA\u30C3\u30C8\u8AAC\u660E\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "\u4F1A\u8A71\u306E\u65B0\u898F\u4F5C\u6210\u306F\u307E\u3060\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH \u306F\u30DA\u30C3\u30C8\u4F5C\u6210\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u53D7\u3051\u4ED8\u3051\u307E\u305B\u3093\u3067\u3057\u305F",
  "\u9879\u76EE\u94FE\u63A5": "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30EA\u30F3\u30AF",
  "\u95EE\u9898\u53CD\u9988": "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "1 \u4EF6\u306E\u30DA\u30C3\u30C8\u30EA\u30BD\u30FC\u30B9\u306E\u78BA\u8A8D\u304C\u5FC5\u8981\u3067\u3059",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "\u4ED6 1 \u4EF6\u306E\u4F1A\u8A71",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "\u9589\u3058\u305F\u901A\u77E5 1 \u4EF6\u3092\u5FA9\u5143"
};

// src/locales/es.ts
var es = {
  "\u5BA0\u7269": "Mascotas",
  "\u5BA0\u7269\u8BBE\u7F6E": "Ajustes de mascota",
  "\u5173\u95ED\u8BBE\u7F6E": "Cerrar ajustes",
  "\u9009\u62E9\u5BA0\u7269": "Elegir una mascota",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "Tu mascota sigue las conversaciones y destaca lo que requiere tu atenci\xF3n.",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "Actualizar biblioteca de mascotas",
  "\u521B\u5EFA": "Crear",
  "\u663E\u793A\u5BA0\u7269": "Mostrar mascota",
  "\u6536\u8D77\u5BA0\u7269": "Ocultar mascota",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "Cargando mascotas\u2026",
  "\u5DF2\u9009": "Seleccionado",
  "\u9009\u62E9": "Seleccionar",
  "\u5DF2\u9009\u62E9": "Seleccionado",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "No se cargaron mascotas. Faltan recursos integrados; reinstala el plugin completo.",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "Mascotas personalizadas de DSH",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "Cargando carpeta\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "Abrir carpeta",
  "\u5916\u89C2": "Apariencia",
  "\u5BA0\u7269\u5927\u5C0F": "Tama\xF1o de la mascota",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "Ajustar el tama\xF1o de la mascota",
  "\u521B\u5EFA\u5BA0\u7269": "Crear una mascota",
  "\u5BA0\u7269\u63CF\u8FF0": "Descripci\xF3n de la mascota",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "Por ejemplo: una peque\xF1a nutria marina con gafas redondas, tranquila y curiosa, estilo peluche\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "Crea en una nueva conversaci\xF3n de DSH con el Skill incluido. El resultado se guarda en la carpeta de mascotas de DSH. Se requiere una herramienta de generaci\xF3n de im\xE1genes en esa conversaci\xF3n.",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "Inicia la creaci\xF3n desde los ajustes de mascotas en DSH. La vista independiente no ofrece servicio de conversaci\xF3n.",
  "\u53D6\u6D88": "Cancelar",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "Crear en DSH",
  "\u521B\u5EFA\u5931\u8D25": "Error al crear",
  "\u64CD\u4F5C\u5931\u8D25": "Operaci\xF3n fallida",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "El servicio de mascotas no est\xE1 disponible",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "Abrir tarea vinculada",
  "\u7A7A\u95F2": "Inactivo",
  "\u6253\u4E2A\u62DB\u547C": "Saludar",
  "\u8DF3\u4E00\u8DF3": "Saltar",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurar notificaciones descartadas",
  "\u6062\u590D\u5931\u8D25": "Error al restaurar",
  "\u67E5\u770B\u4EFB\u52A1": "Ver tarea",
  "\u63D0\u4EA4\u5931\u8D25": "Error al enviar",
  "\u5DE5\u5177\u5BA1\u6279": "Aprobaci\xF3n de herramienta",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "Esta herramienta necesita tu aprobaci\xF3n.",
  "\u62D2\u7EDD": "Rechazar",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "Permitir una vez",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "Introduce una respuesta o detalles adicionales",
  "\u63D0\u4EA4\u56DE\u7B54": "Enviar respuesta",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "Abre la conversaci\xF3n para gestionar esta solicitud.",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "Notificaciones de conversaci\xF3n de mascota",
  "\u6536\u8D77\u4F1A\u8BDD": "Contraer conversaciones",
  "\u5C55\u5F00\u4F1A\u8BDD": "Expandir conversaciones",
  "\u4F1A\u8BDD": "Conversaciones",
  "\u6700\u65B0\u4F18\u5148": "M\xE1s recientes primero",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "Actividad m\xE1s reciente primero",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "Requiere atenci\xF3n primero",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "Descarta la notificaci\xF3n de este turno; la tarea sigue ejecut\xE1ndose",
  "\u67E5\u770B\u5E76\u5904\u7406": "Ver y responder",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "Abrir conversaci\xF3n para responder",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "Detener el turno actual",
  "\u6B63\u5728\u5DE5\u4F5C": "Trabajando",
  "\u7B49\u5F85\u4F60\u5904\u7406": "Esperando tu respuesta",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "Error en la tarea",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "Completado, listo para revisar",
  "\u5F53\u524D\u4EFB\u52A1": "Tarea actual",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "{count} recursos de mascotas requieren atenci\xF3n",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "{count} conversaciones m\xE1s",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurar {count} notificaciones descartadas",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "Descartar notificaci\xF3n: {title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "Gestionar solicitud: {title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "Responder a la conversaci\xF3n: {title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "Detener turno actual: {title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}: respuesta escrita",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}, {status}; arrastra para mover, doble clic para saltar, clic derecho para men\xFA",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "El servicio de conversaci\xF3n no est\xE1 listo",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "La biblioteca de mascotas a\xFAn no se ha cargado",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "Por favor, responde a todas las preguntas",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "Las preguntas han cambiado. Por favor, responde de nuevo.",
  "\u9009\u9879\u65E0\u6548": "Opci\xF3n no v\xE1lida",
  "\u56DE\u7B54\u8FC7\u957F": "La respuesta es demasiado larga",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "Elige una opci\xF3n o ingresa una respuesta escrita",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "Esta notificaci\xF3n se ha actualizado. Usa la notificaci\xF3n m\xE1s reciente.",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "El estado de la tarea ha cambiado",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "El host no admite detener tareas",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "Enviando. Por favor, no repitas la acci\xF3n.",
  "\u505C\u6B62\u5931\u8D25": "No se pudo detener la tarea",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "La solicitud ha finalizado o cambiado. Abre la conversaci\xF3n m\xE1s reciente.",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "Esta solicitud ya ha sido enviada",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "Esta acci\xF3n no es compatible con esta solicitud",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "Introduce una descripci\xF3n de la mascota de 1 a 2000 caracteres",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "La nueva conversaci\xF3n no est\xE1 lista. Int\xE9ntalo de nuevo.",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH no acept\xF3 la solicitud de creaci\xF3n de mascota",
  "\u9879\u76EE\u94FE\u63A5": "Enlaces del proyecto",
  "\u95EE\u9898\u53CD\u9988": "Problemas",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "1 recurso de mascota requiere atenci\xF3n",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "1 conversaci\xF3n m\xE1s",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurar 1 notificaci\xF3n descartada"
};

// src/locales/fr.ts
var fr = {
  "\u5BA0\u7269": "Animaux",
  "\u5BA0\u7269\u8BBE\u7F6E": "Param\xE8tres de l'animal",
  "\u5173\u95ED\u8BBE\u7F6E": "Fermer les param\xE8tres",
  "\u9009\u62E9\u5BA0\u7269": "Choisir un animal",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "Votre animal suit les conversations et met en \xE9vidence ce qui requiert votre attention.",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "Actualiser la biblioth\xE8que d'animaux",
  "\u521B\u5EFA": "Cr\xE9er",
  "\u663E\u793A\u5BA0\u7269": "Afficher l'animal",
  "\u6536\u8D77\u5BA0\u7269": "Masquer l'animal",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "Chargement des animaux\u2026",
  "\u5DF2\u9009": "S\xE9lectionn\xE9",
  "\u9009\u62E9": "S\xE9lectionner",
  "\u5DF2\u9009\u62E9": "S\xE9lectionn\xE9",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "Aucun animal charg\xE9. Les ressources int\xE9gr\xE9es sont manquantes ; r\xE9installez le plugin complet.",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "Animaux personnalis\xE9s DSH",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "Chargement du dossier\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "Ouvrir le dossier",
  "\u5916\u89C2": "Apparence",
  "\u5BA0\u7269\u5927\u5C0F": "Taille de l'animal",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "Ajuster la taille de votre animal",
  "\u521B\u5EFA\u5BA0\u7269": "Cr\xE9er un animal",
  "\u5BA0\u7269\u63CF\u8FF0": "Description de l'animal",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "Par exemple : une petite loutre de mer portant des lunettes rondes, calme et curieuse, style peluche\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "Cr\xE9ez dans une nouvelle conversation DSH avec le Skill fourni. Le r\xE9sultat est enregistr\xE9 dans le dossier des animaux DSH. Un outil de g\xE9n\xE9ration d'images est requis dans cette conversation.",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "Lancez la cr\xE9ation depuis les param\xE8tres de l'animal dans DSH. La vue autonome ne fournit pas de service de conversation.",
  "\u53D6\u6D88": "Annuler",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "Cr\xE9er dans DSH",
  "\u521B\u5EFA\u5931\u8D25": "\xC9chec de cr\xE9ation",
  "\u64CD\u4F5C\u5931\u8D25": "\xC9chec de l'op\xE9ration",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "Le service d'animaux est indisponible",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "Ouvrir la t\xE2che associ\xE9e",
  "\u7A7A\u95F2": "Inactif",
  "\u6253\u4E2A\u62DB\u547C": "Faire un signe",
  "\u8DF3\u4E00\u8DF3": "Sauter",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurer les notifications ferm\xE9es",
  "\u6062\u590D\u5931\u8D25": "\xC9chec de restauration",
  "\u67E5\u770B\u4EFB\u52A1": "Voir la t\xE2che",
  "\u63D0\u4EA4\u5931\u8D25": "\xC9chec de l'envoi",
  "\u5DE5\u5177\u5BA1\u6279": "Approbation de l'outil",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "Cet outil n\xE9cessite votre approbation.",
  "\u62D2\u7EDD": "Refuser",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "Autoriser une fois",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "Saisissez une r\xE9ponse ou des pr\xE9cisions",
  "\u63D0\u4EA4\u56DE\u7B54": "Envoyer la r\xE9ponse",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "Ouvrez la conversation pour traiter cette demande.",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "Notifications de conversation de l'animal",
  "\u6536\u8D77\u4F1A\u8BDD": "R\xE9duire les conversations",
  "\u5C55\u5F00\u4F1A\u8BDD": "D\xE9velopper les conversations",
  "\u4F1A\u8BDD": "Conversations",
  "\u6700\u65B0\u4F18\u5148": "Plus r\xE9cents d'abord",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "Activit\xE9 la plus r\xE9cente d'abord",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "\xC0 traiter en priorit\xE9",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "Fermer la notification de ce tour ; la t\xE2che continue de s'ex\xE9cuter",
  "\u67E5\u770B\u5E76\u5904\u7406": "Voir et r\xE9pondre",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "Ouvrir la conversation pour r\xE9pondre",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "Arr\xEAter le tour actuel",
  "\u6B63\u5728\u5DE5\u4F5C": "En cours",
  "\u7B49\u5F85\u4F60\u5904\u7406": "En attente de votre r\xE9ponse",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "La t\xE2che a \xE9chou\xE9",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "Termin\xE9, pr\xEAt pour examen",
  "\u5F53\u524D\u4EFB\u52A1": "T\xE2che actuelle",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "{count} ressources d'animaux n\xE9cessitent une attention",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "{count} autres conversations",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurer {count} notifications ferm\xE9es",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "Fermer la notification : {title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "Traiter la demande : {title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "R\xE9pondre \xE0 la conversation : {title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "Arr\xEAter le tour actuel : {title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question} : r\xE9ponse \xE9crite",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}, {status} ; glisser pour d\xE9placer, double-clic pour sauter, clic droit pour le menu",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "Le service de conversation n'est pas pr\xEAt",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "La biblioth\xE8que d'animaux n'est pas encore charg\xE9e",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "Veuillez r\xE9pondre \xE0 toutes les questions",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "Les questions ont chang\xE9. Veuillez r\xE9pondre \xE0 nouveau.",
  "\u9009\u9879\u65E0\u6548": "Option non valide",
  "\u56DE\u7B54\u8FC7\u957F": "La r\xE9ponse est trop longue",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "Choisissez une option ou saisissez une r\xE9ponse \xE9crite",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "Cette notification a \xE9t\xE9 mise \xE0 jour. Utilisez la derni\xE8re notification.",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "L'\xE9tat de la t\xE2che a chang\xE9",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "L'h\xF4te ne prend pas en charge l'arr\xEAt des t\xE2ches",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "Envoi en cours. Veuillez ne pas r\xE9p\xE9ter l'action.",
  "\u505C\u6B62\u5931\u8D25": "Impossible d'arr\xEAter la t\xE2che",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "La demande est termin\xE9e ou a chang\xE9. Ouvrez la derni\xE8re conversation.",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "Cette demande a d\xE9j\xE0 \xE9t\xE9 soumise",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "Cette action n'est pas prise en charge pour cette demande",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "Saisissez une description de 1 \xE0 2000 caract\xE8res",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "La nouvelle conversation n'est pas pr\xEAte. Veuillez r\xE9essayer.",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH n'a pas accept\xE9 la demande de cr\xE9ation d'animal",
  "\u9879\u76EE\u94FE\u63A5": "Liens du projet",
  "\u95EE\u9898\u53CD\u9988": "Retours",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "1 ressource d'animal n\xE9cessite une attention",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "1 autre conversation",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurer 1 notification ferm\xE9e"
};

// src/locales/de.ts
var de = {
  "\u5BA0\u7269": "Haustiere",
  "\u5BA0\u7269\u8BBE\u7F6E": "Haustier-Einstellungen",
  "\u5173\u95ED\u8BBE\u7F6E": "Einstellungen schlie\xDFen",
  "\u9009\u62E9\u5BA0\u7269": "Haustier ausw\xE4hlen",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "Dein Haustier verfolgt Konversationen und hebt hervor, was deine Aufmerksamkeit erfordert.",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "Haustier-Bibliothek aktualisieren",
  "\u521B\u5EFA": "Erstellen",
  "\u663E\u793A\u5BA0\u7269": "Haustier anzeigen",
  "\u6536\u8D77\u5BA0\u7269": "Haustier verbergen",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "Haustiere werden geladen\u2026",
  "\u5DF2\u9009": "Ausgew\xE4hlt",
  "\u9009\u62E9": "Ausw\xE4hlen",
  "\u5DF2\u9009\u62E9": "Ausgew\xE4hlt",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "Keine Haustiere geladen. Integrierte Ressourcen fehlen; bitte das vollst\xE4ndige Plugin neu installieren.",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "Benutzerdefinierte DSH-Haustiere",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "Ordner wird geladen\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "Ordner \xF6ffnen",
  "\u5916\u89C2": "Erscheinungsbild",
  "\u5BA0\u7269\u5927\u5C0F": "Haustiergr\xF6\xDFe",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "Gr\xF6\xDFe des Haustiers anpassen",
  "\u521B\u5EFA\u5BA0\u7269": "Haustier erstellen",
  "\u5BA0\u7269\u63CF\u8FF0": "Beschreibung des Haustiers",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "Zum Beispiel: ein ruhiger, neugieriger Seeotter mit runder Brille im Pl\xFCschtier-Stil\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "Erstelle in einer neuen DSH-Konversation mit dem mitgelieferten Skill. Das Ergebnis wird im DSH-Haustierordner gespeichert. Ein Bildgenerierungstool ist in der Konversation erforderlich.",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "Starte die Erstellung in den DSH-Haustiereinstellungen. Die eigenst\xE4ndige Vorschau bietet keinen Konversationsdienst.",
  "\u53D6\u6D88": "Abbrechen",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "In DSH erstellen",
  "\u521B\u5EFA\u5931\u8D25": "Erstellung fehlgeschlagen",
  "\u64CD\u4F5C\u5931\u8D25": "Vorgang fehlgeschlagen",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "Haustierdienst vor\xFCbergehend nicht verf\xFCgbar",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "Verkn\xFCpfte Aufgabe \xF6ffnen",
  "\u7A7A\u95F2": "Unt\xE4tig",
  "\u6253\u4E2A\u62DB\u547C": "Winken",
  "\u8DF3\u4E00\u8DF3": "H\xFCpfen",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "Verworfene Benachrichtigungen wiederherstellen",
  "\u6062\u590D\u5931\u8D25": "Wiederherstellung fehlgeschlagen",
  "\u67E5\u770B\u4EFB\u52A1": "Aufgabe anzeigen",
  "\u63D0\u4EA4\u5931\u8D25": "\xDCbermittlung fehlgeschlagen",
  "\u5DE5\u5177\u5BA1\u6279": "Tool-Genehmigung",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "Dieses Tool ben\xF6tigt deine Genehmigung.",
  "\u62D2\u7EDD": "Ablehnen",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "Einmalig erlauben",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "Antwort oder zus\xE4tzliche Details eingeben",
  "\u63D0\u4EA4\u56DE\u7B54": "Antwort absenden",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "\xD6ffne die Konversation, um diese Anfrage zu bearbeiten.",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "Haustier-Konversationsbenachrichtigungen",
  "\u6536\u8D77\u4F1A\u8BDD": "Konversationen einklappen",
  "\u5C55\u5F00\u4F1A\u8BDD": "Konversationen ausklappen",
  "\u4F1A\u8BDD": "Konversationen",
  "\u6700\u65B0\u4F18\u5148": "Neueste zuerst",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "Neueste Aktivit\xE4t zuerst",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "Aufmerksamkeit erforderlich zuerst",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "Benachrichtigung dieser Runde verwerfen; die Aufgabe l\xE4uft weiter",
  "\u67E5\u770B\u5E76\u5904\u7406": "Ansehen und bearbeiten",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "Konversation zum Antworten \xF6ffnen",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "Aktuelle Runde anhalten",
  "\u6B63\u5728\u5DE5\u4F5C": "Arbeitet",
  "\u7B49\u5F85\u4F60\u5904\u7406": "Wartet auf dich",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "Aufgabe fehlgeschlagen",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "Abgeschlossen, bereit zur Pr\xFCfung",
  "\u5F53\u524D\u4EFB\u52A1": "Aktuelle Aufgabe",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "{count} Haustier-Ressourcen erfordern Aufmerksamkeit",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "Noch {count} weitere Konversationen",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "{count} verworfene Benachrichtigungen wiederherstellen",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "Benachrichtigung verwerfen: {title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "Anfrage bearbeiten: {title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "Auf Konversation antworten: {title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "Aktuelle Runde anhalten: {title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}: schriftliche Antwort",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}, {status}; Ziehen zum Bewegen, Doppelklick zum H\xFCpfen, Rechtsklick f\xFCr Men\xFC",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "Konversationsdienst ist noch nicht bereit",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "Haustier-Bibliothek ist noch nicht geladen",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "Bitte beantworte alle Fragen",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "Die Fragen haben sich ge\xE4ndert. Bitte antworte erneut.",
  "\u9009\u9879\u65E0\u6548": "Ung\xFCltige Option",
  "\u56DE\u7B54\u8FC7\u957F": "Antwort ist zu lang",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "W\xE4hle eine Option oder gib eine schriftliche Antwort ein",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "Diese Benachrichtigung wurde aktualisiert. Verwende die neueste Benachrichtigung.",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "Aufgabenstatus hat sich ge\xE4ndert",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "Der Host unterst\xFCtzt das Anhalten von Aufgaben nicht",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "Wird \xFCbermittelt. Bitte den Vorgang nicht wiederholen.",
  "\u505C\u6B62\u5931\u8D25": "Aufgabe konnte nicht angehalten werden",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "Die Anfrage ist beendet oder ge\xE4ndert. \xD6ffne die neueste Konversation.",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "Diese Anfrage wurde bereits \xFCbermittelt",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "Diese Aktion wird f\xFCr diese Anfrage nicht unterst\xFCtzt",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "Gib eine Haustierbeschreibung mit 1\u20132000 Zeichen ein",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "Neue Konversation ist noch nicht bereit. Bitte erneut versuchen.",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH hat die Haustiererstellungsanfrage nicht angenommen",
  "\u9879\u76EE\u94FE\u63A5": "Projekt-Links",
  "\u95EE\u9898\u53CD\u9988": "Feedback",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "1 Haustier-Ressource erfordert Aufmerksamkeit",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "Noch 1 weitere Konversation",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "1 verworfene Benachrichtigung wiederherstellen"
};

// src/locales/ru.ts
var ru = {
  "\u5BA0\u7269": "\u041F\u0438\u0442\u043E\u043C\u0446\u044B",
  "\u5BA0\u7269\u8BBE\u7F6E": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u5173\u95ED\u8BBE\u7F6E": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
  "\u9009\u62E9\u5BA0\u7269": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "\u0412\u0430\u0448 \u043F\u0438\u0442\u043E\u043C\u0435\u0446 \u0441\u043B\u0435\u0434\u0438\u0442 \u0437\u0430 \u0431\u0435\u0441\u0435\u0434\u0430\u043C\u0438 \u0438 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442, \u043D\u0430 \u0447\u0442\u043E \u0441\u0442\u043E\u0438\u0442 \u043E\u0431\u0440\u0430\u0442\u0438\u0442\u044C \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435.",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432",
  "\u521B\u5EFA": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
  "\u663E\u793A\u5BA0\u7269": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u6536\u8D77\u5BA0\u7269": "\u0421\u043A\u0440\u044B\u0442\u044C \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432\u2026",
  "\u5DF2\u9009": "\u0412\u044B\u0431\u0440\u0430\u043D\u043E",
  "\u9009\u62E9": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C",
  "\u5DF2\u9009\u62E9": "\u0412\u044B\u0431\u0440\u0430\u043D\u043E",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "\u041F\u0438\u0442\u043E\u043C\u0446\u044B \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B. \u0412\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0435 \u0440\u0435\u0441\u0443\u0440\u0441\u044B \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442; \u043F\u0435\u0440\u0435\u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u043F\u043E\u043B\u043D\u044B\u0439 \u043F\u043B\u0430\u0433\u0438\u043D.",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0435 \u043F\u0438\u0442\u043E\u043C\u0446\u044B DSH",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "\u0427\u0442\u0435\u043D\u0438\u0435 \u043F\u0430\u043F\u043A\u0438\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0430\u043F\u043A\u0443",
  "\u5916\u89C2": "\u0412\u043D\u0435\u0448\u043D\u0438\u0439 \u0432\u0438\u0434",
  "\u5BA0\u7269\u5927\u5C0F": "\u0420\u0430\u0437\u043C\u0435\u0440 \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0440\u0430\u0437\u043C\u0435\u0440 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u521B\u5EFA\u5BA0\u7269": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u5BA0\u7269\u63CF\u8FF0": "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0442\u0438\u0445\u0430\u044F \u0438 \u043B\u044E\u0431\u043E\u043F\u044B\u0442\u043D\u0430\u044F \u043C\u043E\u0440\u0441\u043A\u0430\u044F \u0432\u044B\u0434\u0440\u0430 \u0432 \u043A\u0440\u0443\u0433\u043B\u044B\u0445 \u043E\u0447\u043A\u0430\u0445 \u0432 \u0441\u0442\u0438\u043B\u0435 \u043F\u043B\u044E\u0448\u0435\u0432\u043E\u0439 \u0438\u0433\u0440\u0443\u0448\u043A\u0438\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0438\u0442\u043E\u043C\u0446\u0430 \u0432 \u043D\u043E\u0432\u043E\u0439 \u0431\u0435\u0441\u0435\u0434\u0435 DSH \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u043E\u0433\u043E \u043D\u0430\u0432\u044B\u043A\u0430 Skill. \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u0432 \u043F\u0430\u043F\u043A\u0443 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432 DSH. \u0412 \u0431\u0435\u0441\u0435\u0434\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0439.",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0438\u0437 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u043F\u0438\u0442\u043E\u043C\u0446\u0430 \u0432 \u0433\u043B\u0430\u0432\u043D\u043E\u043C \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0435 DSH; \u0430\u0432\u0442\u043E\u043D\u043E\u043C\u043D\u044B\u0439 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u0441\u043B\u0443\u0436\u0431\u0443 \u0431\u0435\u0441\u0435\u0434.",
  "\u53D6\u6D88": "\u041E\u0442\u043C\u0435\u043D\u0430",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0432 DSH",
  "\u521B\u5EFA\u5931\u8D25": "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F",
  "\u64CD\u4F5C\u5931\u8D25": "\u0421\u0431\u043E\u0439 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "\u0421\u043B\u0443\u0436\u0431\u0430 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443",
  "\u7A7A\u95F2": "\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435",
  "\u6253\u4E2A\u62DB\u547C": "\u041F\u043E\u043C\u0430\u0445\u0430\u0442\u044C",
  "\u8DF3\u4E00\u8DF3": "\u041F\u0440\u044B\u0433\u043D\u0443\u0442\u044C",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u043A\u0440\u044B\u0442\u044B\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
  "\u6062\u590D\u5931\u8D25": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
  "\u67E5\u770B\u4EFB\u52A1": "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443",
  "\u63D0\u4EA4\u5931\u8D25": "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438",
  "\u5DE5\u5177\u5BA1\u6279": "\u041E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "\u042D\u0442\u043E\u0442 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u0430\u0448\u0435\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F.",
  "\u62D2\u7EDD": "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C \u043E\u0434\u0438\u043D \u0440\u0430\u0437",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043E\u0442\u0432\u0435\u0442 \u0438\u043B\u0438 \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u044F\u0441\u043D\u0435\u043D\u0438\u044F",
  "\u63D0\u4EA4\u56DE\u7B54": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0431\u0435\u0441\u0435\u0434\u0443 \u0434\u043B\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u044D\u0442\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430.",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043F\u0438\u0442\u043E\u043C\u0446\u0430 \u043E \u0431\u0435\u0441\u0435\u0434\u0430\u0445",
  "\u6536\u8D77\u4F1A\u8BDD": "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0431\u0435\u0441\u0435\u0434\u044B",
  "\u5C55\u5F00\u4F1A\u8BDD": "\u0420\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0431\u0435\u0441\u0435\u0434\u044B",
  "\u4F1A\u8BDD": "\u0411\u0435\u0441\u0435\u0434\u044B",
  "\u6700\u65B0\u4F18\u5148": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u043E\u0432\u044B\u0435",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441 \u043D\u0435\u0434\u0430\u0432\u043D\u0435\u0439 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C\u044E",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0442\u0440\u0435\u0431\u0443\u044E\u0449\u0438\u0435 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u044F",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u044D\u0442\u043E\u0433\u043E \u0440\u0430\u0443\u043D\u0434\u0430; \u0437\u0430\u0434\u0430\u0447\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0442\u044C\u0441\u044F",
  "\u67E5\u770B\u5E76\u5904\u7406": "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0438 \u043E\u0442\u0432\u0435\u0442\u0438\u0442\u044C",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0431\u0435\u0441\u0435\u0434\u0443 \u0434\u043B\u044F \u043E\u0442\u0432\u0435\u0442\u0430",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u0440\u0430\u0443\u043D\u0434",
  "\u6B63\u5728\u5DE5\u4F5C": "\u0412 \u0440\u0430\u0431\u043E\u0442\u0435",
  "\u7B49\u5F85\u4F60\u5904\u7406": "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u0432\u0430\u0448\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E, \u0433\u043E\u0442\u043E\u0432\u043E \u043A \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0435",
  "\u5F53\u524D\u4EFB\u52A1": "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C {count} \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "\u0415\u0449\u0451 {count} \u0431\u0435\u0441\u0435\u0434",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C {count} \u0437\u0430\u043A\u0440\u044B\u0442\u044B\u0445 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435: {title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441: {title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C \u0432 \u0431\u0435\u0441\u0435\u0434\u0435: {title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u0440\u0430\u0443\u043D\u0434: {title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}: \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u043E\u0442\u0432\u0435\u0442",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}, {status}; \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u044F, \u0434\u0432\u043E\u0439\u043D\u043E\u0439 \u043A\u043B\u0438\u043A \u2014 \u043F\u0440\u044B\u0436\u043E\u043A, \u043F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A \u2014 \u043C\u0435\u043D\u044E",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "\u0421\u043B\u0443\u0436\u0431\u0430 \u0431\u0435\u0441\u0435\u0434 \u0435\u0449\u0451 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u0430",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432 \u0435\u0449\u0451 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043E\u0442\u0432\u0435\u0442\u044C\u0442\u0435 \u043D\u0430 \u0432\u0441\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0438\u0441\u044C. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043E\u0442\u0432\u0435\u0442\u044C\u0442\u0435 \u0437\u0430\u043D\u043E\u0432\u043E.",
  "\u9009\u9879\u65E0\u6548": "\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442",
  "\u56DE\u7B54\u8FC7\u957F": "\u041E\u0442\u0432\u0435\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "\u0414\u043B\u044F \u0432\u043E\u043F\u0440\u043E\u0441\u0430 \u0441 \u043E\u0434\u043D\u0438\u043C \u0432\u044B\u0431\u043E\u0440\u043E\u043C \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0434\u0438\u043D \u043E\u0442\u0432\u0435\u0442",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "\u042D\u0442\u043E \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u043E\u0431\u043D\u043E\u0432\u0438\u043B\u043E\u0441\u044C. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435.",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0441\u044F",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "\u0425\u043E\u0441\u0442 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443 \u0437\u0430\u0434\u0430\u0447",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043D\u0435 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0439\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.",
  "\u505C\u6B62\u5931\u8D25": "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "\u0417\u0430\u043F\u0440\u043E\u0441 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D \u0438\u043B\u0438 \u0438\u0437\u043C\u0435\u043D\u0451\u043D. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044E\u044E \u0431\u0435\u0441\u0435\u0434\u0443.",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "\u042D\u0442\u043E\u0442 \u0437\u0430\u043F\u0440\u043E\u0441 \u0443\u0436\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0434\u043B\u044F \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0438\u0442\u043E\u043C\u0446\u0430 \u0434\u043B\u0438\u043D\u043E\u0439 \u043E\u0442 1 \u0434\u043E 2000 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0431\u0435\u0441\u0435\u0434\u044B \u0435\u0449\u0451 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430.",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u0437\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0438\u0442\u043E\u043C\u0446\u0430",
  "\u9879\u76EE\u94FE\u63A5": "\u0421\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u043F\u0440\u043E\u0435\u043A\u0442",
  "\u95EE\u9898\u53CD\u9988": "\u041E\u0442\u0437\u044B\u0432\u044B",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C 1 \u0440\u0435\u0441\u0443\u0440\u0441 \u043F\u0438\u0442\u043E\u043C\u0446\u0435\u0432",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "\u0415\u0449\u0451 1 \u0431\u0435\u0441\u0435\u0434\u0430",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C 1 \u0437\u0430\u043A\u0440\u044B\u0442\u043E\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435"
};

// src/locales/pt.ts
var pt = {
  "\u5BA0\u7269": "Mascotes",
  "\u5BA0\u7269\u8BBE\u7F6E": "Configura\xE7\xF5es do mascote",
  "\u5173\u95ED\u8BBE\u7F6E": "Fechar configura\xE7\xF5es",
  "\u9009\u62E9\u5BA0\u7269": "Escolher um mascote",
  "\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879": "Seu mascote acompanha as conversas e destaca o que precisa da sua aten\xE7\xE3o.",
  "\u5237\u65B0\u5BA0\u7269\u5E93": "Atualizar biblioteca de mascotes",
  "\u521B\u5EFA": "Criar",
  "\u663E\u793A\u5BA0\u7269": "Mostrar mascote",
  "\u6536\u8D77\u5BA0\u7269": "Ocultar mascote",
  "\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026": "Carregando mascotes\u2026",
  "\u5DF2\u9009": "Selecionado",
  "\u9009\u62E9": "Selecionar",
  "\u5DF2\u9009\u62E9": "Selecionado",
  "\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002": "Nenhum mascote carregado. Recursos integrados ausentes; reinstale o plugin completo.",
  "DSH \u81EA\u5B9A\u4E49\u5BA0\u7269": "Mascotes personalizados do DSH",
  "\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026": "Carregando pasta\u2026",
  "\u6253\u5F00\u6587\u4EF6\u5939": "Abrir pasta",
  "\u5916\u89C2": "Apar\xEAncia",
  "\u5BA0\u7269\u5927\u5C0F": "Tamanho do mascote",
  "\u8C03\u6574\u5BA0\u7269\u5927\u5C0F": "Ajustar o tamanho do mascote",
  "\u521B\u5EFA\u5BA0\u7269": "Criar um mascote",
  "\u5BA0\u7269\u63CF\u8FF0": "Descri\xE7\xE3o do mascote",
  "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026": "Por exemplo: uma pequena lontra marinha usando \xF3culos redondos, quieta, curiosa, estilo bicho de pel\xFAcia\u2026",
  "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002": "Crie em uma nova conversa do DSH usando o Skill inclu\xEDdo. O resultado \xE9 salvo na pasta de mascotes do DSH. \xC9 necess\xE1ria uma ferramenta de gera\xE7\xE3o de imagens na conversa.",
  "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002": "Inicie a cria\xE7\xE3o nas configura\xE7\xF5es de mascotes do DSH. A visualiza\xE7\xE3o independente n\xE3o oferece servi\xE7o de conversa.",
  "\u53D6\u6D88": "Cancelar",
  "\u5728 DSH \u4E2D\u521B\u5EFA": "Criar no DSH",
  "\u521B\u5EFA\u5931\u8D25": "Falha na cria\xE7\xE3o",
  "\u64CD\u4F5C\u5931\u8D25": "Falha na opera\xE7\xE3o",
  "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528": "O servi\xE7o de mascotes est\xE1 indispon\xEDvel",
  "\u6253\u5F00\u5173\u8054\u4EFB\u52A1": "Abrir tarefa vinculada",
  "\u7A7A\u95F2": "Ocioso",
  "\u6253\u4E2A\u62DB\u547C": "Acenar",
  "\u8DF3\u4E00\u8DF3": "Pular",
  "\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurar notifica\xE7\xF5es descartadas",
  "\u6062\u590D\u5931\u8D25": "Falha ao restaurar",
  "\u67E5\u770B\u4EFB\u52A1": "Ver tarefa",
  "\u63D0\u4EA4\u5931\u8D25": "Falha no envio",
  "\u5DE5\u5177\u5BA1\u6279": "Aprova\xE7\xE3o de ferramenta",
  "\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002": "Esta ferramenta precisa da sua aprova\xE7\xE3o.",
  "\u62D2\u7EDD": "Rejeitar",
  "\u4EC5\u5141\u8BB8\u4E00\u6B21": "Permitir uma vez",
  "\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E": "Insira uma resposta ou detalhes adicionais",
  "\u63D0\u4EA4\u56DE\u7B54": "Enviar resposta",
  "\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002": "Abra a conversa para atender a esta solicita\xE7\xE3o.",
  "\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5": "Notifica\xE7\xF5es de conversa do mascote",
  "\u6536\u8D77\u4F1A\u8BDD": "Recolher conversas",
  "\u5C55\u5F00\u4F1A\u8BDD": "Expandir conversas",
  "\u4F1A\u8BDD": "Conversas",
  "\u6700\u65B0\u4F18\u5148": "Mais recentes primeiro",
  "\u6700\u65B0\u6D3B\u52A8\u4F18\u5148": "Atividade mais recente primeiro",
  "\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148": "Aten\xE7\xE3o necess\xE1ria primeiro",
  "\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C": "Dispensar notifica\xE7\xE3o desta rodada; a tarefa continua em execu\xE7\xE3o",
  "\u67E5\u770B\u5E76\u5904\u7406": "Ver e responder",
  "\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D": "Abrir conversa para responder",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21": "Parar rodada atual",
  "\u6B63\u5728\u5DE5\u4F5C": "Trabalhando",
  "\u7B49\u5F85\u4F60\u5904\u7406": "Aguardando voc\xEA",
  "\u4EFB\u52A1\u51FA\u9519\u4E86": "Falha na tarefa",
  "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B": "Conclu\xEDdo, pronto para revis\xE3o",
  "\u5F53\u524D\u4EFB\u52A1": "Tarefa atual",
  "\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "{count} recursos de mascotes precisam de aten\xE7\xE3o",
  "\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD": "Mais {count} conversas",
  "\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurar {count} notifica\xE7\xF5es descartadas",
  "\u5173\u95ED\u901A\u77E5\uFF1A{title}": "Dispensar notifica\xE7\xE3o: {title}",
  "\u5904\u7406\u8BF7\u6C42\uFF1A{title}": "Atender solicita\xE7\xE3o: {title}",
  "\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}": "Responder \xE0 conversa: {title}",
  "\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}": "Parar rodada atual: {title}",
  "{question}\uFF1A\u6587\u5B57\u56DE\u7B54": "{question}: resposta por escrito",
  "{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355": "{name}, {status}; arraste para mover, clique duplo para pular, bot\xE3o direito para o menu",
  "\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA": "O servi\xE7o de conversas ainda n\xE3o est\xE1 pronto",
  "\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D": "A biblioteca de mascotes ainda n\xE3o foi carregada",
  "\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898": "Por favor, responda a todas as perguntas",
  "\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54": "As perguntas mudaram. Por favor, responda novamente.",
  "\u9009\u9879\u65E0\u6548": "Op\xE7\xE3o inv\xE1lida",
  "\u56DE\u7B54\u8FC7\u957F": "A resposta \xE9 muito longa",
  "\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54": "Escolha uma op\xE7\xE3o ou insira uma resposta escrita",
  "\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5": "Esta notifica\xE7\xE3o foi atualizada. Use a notifica\xE7\xE3o mais recente.",
  "\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316": "O estado da tarefa mudou",
  "\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B": "O host n\xE3o suporta a parada de tarefas",
  "\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C": "Enviando. Por favor, n\xE3o repita a a\xE7\xE3o.",
  "\u505C\u6B62\u5931\u8D25": "N\xE3o foi poss\xEDvel parar a tarefa",
  "\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD": "A solicita\xE7\xE3o foi conclu\xEDda ou alterada. Abra a conversa mais recente.",
  "\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4": "Esta solicita\xE7\xE3o j\xE1 foi enviada",
  "\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C": "Esta a\xE7\xE3o n\xE3o \xE9 suportada para esta solicita\xE7\xE3o",
  "\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0": "Insira uma descri\xE7\xE3o do mascote de 1 a 2000 caracteres",
  "\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5": "A nova conversa n\xE3o est\xE1 pronta. Tente novamente.",
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "O DSH n\xE3o aceitou a solicita\xE7\xE3o de cria\xE7\xE3o de mascote",
  "\u9879\u76EE\u94FE\u63A5": "Links do projeto",
  "\u95EE\u9898\u53CD\u9988": "Feedbacks",
  "GitHub": "GitHub",
  "\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5": "1 recurso de mascote precisa de aten\xE7\xE3o",
  "\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD": "Mais 1 conversa",
  "\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5": "Restaurar 1 notifica\xE7\xE3o descartada"
};

// src/ui-locales.ts
var dictionaries = {
  zh,
  en,
  ja,
  es,
  fr,
  de,
  ru,
  pt
};
function normalizeLanguage(lang) {
  if (!lang) return "en";
  const l = lang.toLowerCase().trim();
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("en")) return "en";
  if (l.startsWith("ja")) return "ja";
  if (l.startsWith("es")) return "es";
  if (l.startsWith("fr")) return "fr";
  if (l.startsWith("de")) return "de";
  if (l.startsWith("ru")) return "ru";
  if (l.startsWith("pt")) return "pt";
  return "en";
}
function translator(language) {
  return (message, values = {}) => {
    const norm = normalizeLanguage(language);
    const dict = dictionaries[norm] ?? dictionaries.en;
    const text = dict?.[message] ?? dictionaries.en[message] ?? message;
    return text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
  };
}

// src/client.tsx
var import_react8 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/library-store.ts
function createLibraryStore(request2) {
  let snapshot = { library: null, error: "" }, sequence = 0, mutations = 0;
  let timer;
  let reading;
  const listeners = /* @__PURE__ */ new Set();
  const publish = (next) => {
    if (JSON.stringify(snapshot) === JSON.stringify(next)) return;
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const run = async (path, data) => {
    const current = ++sequence;
    if (data !== void 0) mutations++;
    try {
      const library = await request2(path, data);
      if (current === sequence) publish({ library, error: "" });
    } catch (error) {
      if (current === sequence) publish({ ...snapshot, error: error instanceof Error ? error.message : "\u64CD\u4F5C\u5931\u8D25" });
      throw error;
    } finally {
      if (data !== void 0) mutations--;
    }
  };
  const read = () => {
    if (document.hidden || reading || mutations) return;
    reading = run("state").catch(() => {
    }).finally(() => {
      reading = void 0;
    });
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1) {
        read();
        timer = setInterval(read, 2500);
        window.addEventListener("focus", read);
        document.addEventListener("visibilitychange", read);
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          clearInterval(timer);
          window.removeEventListener("focus", read);
          document.removeEventListener("visibilitychange", read);
        }
      };
    },
    run
  };
}

// src/plugin-update-ui.tsx
var import_react2 = require("react");

// src/project-icons.tsx
var import_react = __toESM(require("react"), 1);
var primitives = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
function GithubMark16() {
  return import_react.default.createElement(
    "svg",
    { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true, focusable: false },
    import_react.default.createElement("path", { fill: "currentColor", d: "M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z" })
  );
}
var IconEditOutlineRegular2 = primitives.IconEditOutlineRegular;
function FeedbackMark16() {
  if (typeof IconEditOutlineRegular2 === "function") {
    return import_react.default.createElement(IconEditOutlineRegular2, { size: 16 });
  }
  return import_react.default.createElement(
    "svg",
    { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true, focusable: false },
    import_react.default.createElement("path", { fill: "currentColor", d: "M11.06 1.94a1.5 1.5 0 0 1 2.12 2.12l-8.5 8.5a1.5 1.5 0 0 1-.64.38l-2.5.71a.5.5 0 0 1-.61-.61l.71-2.5a1.5 1.5 0 0 1 .38-.64l8.5-8.5Z" })
  );
}

// src/plugin-update-ui.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function PluginUpdateHeader({ locale }) {
  const language = (0, import_react2.useSyncExternalStore)(
    (fn) => locale?.subscribe(fn) ?? (() => {
    }),
    () => locale?.getSnapshot().active ?? "zh"
  );
  const t = translator(language);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.dcp-project-head{display:flex;align-items:center;justify-content:flex-start;gap:8px 12px;flex-wrap:wrap;margin-bottom:0}.dcp-project-head h1{display:inline-flex;align-items:baseline;margin:0;white-space:nowrap}.dcp-version{font-size:12px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-tertiary,#9da1aa);margin-left:10px}.dcp-project-links{display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:nowrap;flex:0 0 auto}.dcp-project-links a{display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;min-height:28px;height:28px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2,#383838));border-radius:var(--dsw-radius-sm,7px);background:transparent;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap;cursor:pointer}.dcp-project-links a:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0a);color:var(--dsw-alias-label-primary,inherit)}.dcp-project-links a:focus-visible{outline:var(--dsw-focus-ring-width,1px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4f8cff));outline-offset:2px}.dcp-project-links svg{display:block;flex:none;width:16px;height:16px}` }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dcp-project-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
        t("\u5BA0\u7269"),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dcp-version", children: [
          "v",
          "1.0.13"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          className: "dcp-project-links",
          role: "navigation",
          "aria-label": t("\u9879\u76EE\u94FE\u63A5"),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "a",
              {
                href: "https://github.com/MichengAI/dsh-codex-pet",
                target: "_blank",
                rel: "noreferrer",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GithubMark16, {}),
                  "GitHub"
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
              "a",
              {
                href: "https://github.com/MichengAI/dsh-codex-pet/issues",
                target: "_blank",
                rel: "noreferrer",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackMark16, {}),
                  t("\u95EE\u9898\u53CD\u9988")
                ]
              }
            )
          ]
        }
      )
    ] })
  ] });
}

// src/model.ts
var BASE = "/dsh-codex-pet";
var BUILTINS = [
  ["codex", "Codex", "The original Codex companion."],
  ["dewey", "Dewey", "A calm companion for focused workspace days."],
  ["fireball", "Fireball", "Hot path energy for fast iteration."],
  ["hoots", "Hoots", "A sharp-eyed owl for polished work in a blink."],
  ["rocky", "Rocky", "A steady rock when the diff gets large."],
  ["seedy", "Seedy", "Small green shoots for new ideas."],
  ["stacky", "Stacky", "A balanced stack for deep work."],
  ["bsod", "BSOD", "A tiny blue-screen gremlin."],
  ["null-signal", "Null Signal", "Quiet signal from the void."]
];
var ANIMATIONS = {
  idle: { row: 0, durations: [280, 110, 110, 140, 140, 320] },
  "running-right": {
    row: 1,
    durations: [120, 120, 120, 120, 120, 120, 120, 220]
  },
  "running-left": {
    row: 2,
    durations: [120, 120, 120, 120, 120, 120, 120, 220]
  },
  waving: { row: 3, durations: [140, 140, 140, 280] },
  jumping: { row: 4, durations: [140, 140, 140, 140, 280] },
  failed: { row: 5, durations: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, durations: [150, 150, 150, 150, 150, 260] },
  running: { row: 7, durations: [120, 120, 120, 120, 120, 220] },
  review: { row: 8, durations: [150, 150, 150, 150, 150, 280] }
};
var IDLE = { pose: "idle", title: "", text: "" };
function selectActivity(sessions, current) {
  const ordered = [...sessions].sort(
    (a, b) => Number(b.id === current) - Number(a.id === current)
  );
  const target = ordered.find((s) => s.waiting) ?? ordered.find((s) => s.error) ?? ordered.find((s) => s.completed) ?? ordered.find((s) => s.running);
  if (!target) return IDLE;
  return {
    pose: target.waiting ? "waiting" : target.error ? "failed" : target.completed ? "review" : "running",
    title: target.title ?? "\u5F53\u524D\u4EFB\u52A1",
    text: target.waiting ? "\u7B49\u5F85\u4F60\u5904\u7406" : target.error ? "\u4EFB\u52A1\u51FA\u9519\u4E86" : target.completed ? "\u5DF2\u5B8C\u6210\uFF0C\u5F85\u4F60\u67E5\u770B" : "\u6B63\u5728\u5DE5\u4F5C",
    sessionId: target.id
  };
}
function lookCell(dx, dy) {
  if (Math.hypot(dx, dy) < 28) return null;
  const index = Math.round(
    (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 8)
  ) % 16;
  return { row: 9 + Math.floor(index / 8), col: index % 8 };
}

// src/pet-locales.ts
var zh2 = {
  codex: ["Codex", "\u6700\u521D\u7684 Codex \u5C0F\u4F19\u4F34\u3002"],
  dewey: ["\u9732\u9732", "\u5B89\u9759\u966A\u4F34\uFF0C\u8BA9\u4F60\u4E13\u6CE8\u6BCF\u4E00\u5929\u3002"],
  fireball: ["\u5C0F\u706B\u7403", "\u6D3B\u529B\u6EE1\u6EE1\uFF0C\u966A\u4F60\u5FEB\u901F\u63A8\u8FDB\u3002"],
  hoots: ["\u5495\u5495", "\u76EE\u5149\u654F\u9510\u7684\u5C0F\u732B\u5934\u9E70\uFF0C\u966A\u4F60\u6253\u78E8\u6BCF\u4E2A\u7EC6\u8282\u3002"],
  rocky: ["\u5C0F\u77F3\u5934", "\u6539\u52A8\u518D\u591A\uFF0C\u4E5F\u6709\u7A33\u7A33\u7684\u966A\u4F34\u3002"],
  seedy: ["\u5C0F\u82BD", "\u4E00\u70B9\u65B0\u7EFF\uFF0C\u966A\u65B0\u60F3\u6CD5\u6162\u6162\u53D1\u82BD\u3002"],
  stacky: ["\u53E0\u53E0", "\u7A33\u7A33\u53E0\u597D\uFF0C\u5B89\u5FC3\u6295\u5165\u6DF1\u5EA6\u5DE5\u4F5C\u3002"],
  bsod: ["\u84DD\u5C4F\u5C0F\u7CBE\u7075", "\u4F4F\u5728\u5C0F\u84DD\u5C4F\u91CC\u7684\u8C03\u76AE\u7CBE\u7075\u3002"],
  "null-signal": ["\u7A7A\u4FE1\u53F7", "\u6765\u81EA\u865A\u7A7A\u7684\u4E00\u70B9\u5B89\u9759\u56DE\u5E94\u3002"]
};
var ja2 = {
  codex: ["Codex", "\u5143\u7956 Codex \u306E\u4EF2\u9593\u3002"],
  dewey: ["\u9732\u9732 (Dewey)", "\u7A4F\u3084\u304B\u306A\u4ED8\u304D\u6DFB\u3044\u3067\u3001\u6BCE\u65E5\u306E\u96C6\u4E2D\u3092\u30B5\u30DD\u30FC\u30C8\u3002"],
  fireball: ["\u30D5\u30A1\u30A4\u30E4\u30FC\u30DC\u30FC\u30EB", "\u30A8\u30CD\u30EB\u30AE\u30FC\u6E80\u70B9\u3067\u3001\u7D20\u65E9\u3044\u30A4\u30C6\u30EC\u30FC\u30B7\u30E7\u30F3\u3092\u5F8C\u62BC\u3057\u3002"],
  hoots: ["\u30DB\u30FC\u30DB\u30FC (Hoots)", "\u92ED\u3044\u773C\u5DEE\u3057\u306E\u5C0F\u3055\u306A\u30D5\u30AF\u30ED\u30A6\u3002\u7D30\u90E8\u307E\u3067\u78E8\u304D\u4E0A\u3052\u307E\u3059\u3002"],
  rocky: ["\u30ED\u30C3\u30AD\u30FC", "\u3069\u3093\u306A\u306B\u5DEE\u5206\u304C\u5927\u304D\u304F\u3066\u3082\u3001\u983C\u3082\u3057\u3044\u76F8\u68D2\u3002"],
  seedy: ["\u30B7\u30FC\u30C7\u30A3\u30FC", "\u65B0\u3057\u3044\u30A2\u30A4\u30C7\u30A2\u3092\u82BD\u5439\u304B\u305B\u308B\u5C0F\u3055\u306A\u7DD1\u3002"],
  stacky: ["\u30B9\u30BF\u30C3\u30AD\u30FC", "\u3057\u3063\u304B\u308A\u3068\u7A4D\u307F\u91CD\u306D\u3001\u6DF1\u3044\u96C6\u4E2D\u30EF\u30FC\u30AF\u3078\u3002"],
  bsod: ["\u30D6\u30EB\u30FC\u30B9\u30AF\u30EA\u30FC\u30F3\u5C0F\u60AA\u9B54", "\u5C0F\u3055\u306A\u30D6\u30EB\u30FC\u30B9\u30AF\u30EA\u30FC\u30F3\u306B\u4F4F\u3080\u3044\u305F\u305A\u3089\u597D\u304D\u306A\u5996\u7CBE\u3002"],
  "null-signal": ["\u30CC\u30EB\u30B7\u30B0\u30CA\u30EB", "\u865A\u7A7A\u304B\u3089\u5C4A\u304F\u9759\u304B\u306A\u5FDC\u7B54\u3002"]
};
var es2 = {
  codex: ["Codex", "El compa\xF1ero original de Codex."],
  dewey: ["Dewey", "Un compa\xF1ero tranquilo para d\xEDas de m\xE1xima concentraci\xF3n."],
  fireball: ["Fireball", "Energ\xEDa pura para una iteraci\xF3n r\xE1pida."],
  hoots: ["Hoots", "Un b\xFAho de mirada aguda para pulir cada detalle."],
  rocky: ["Rocky", "Una roca firme cuando las diferencias aumentan."],
  seedy: ["Seedy", "Peque\xF1os brotes verdes para nuevas ideas."],
  stacky: ["Stacky", "Una pila equilibrada para trabajo profundo."],
  bsod: ["BSOD", "Un duendecillo travieso de pantalla azul."],
  "null-signal": ["Null Signal", "Una se\xF1al tranquila desde el vac\xEDo."]
};
var fr2 = {
  codex: ["Codex", "Le compagnon Codex originel."],
  dewey: ["Dewey", "Un compagnon calme pour des journ\xE9es de travail concentr\xE9es."],
  fireball: ["Fireball", "Une \xE9nergie vive pour avancer rapidement."],
  hoots: ["Hoots", "Une petite chouette au regard vif pour peaufiner chaque d\xE9tail."],
  rocky: ["Rocky", "Un roc in\xE9branlable m\xEAme face aux plus gros diffs."],
  seedy: ["Seedy", "De petites pousses vertes pour faire germer vos id\xE9es."],
  stacky: ["Stacky", "Bien empil\xE9 pour plonger dans un travail en profondeur."],
  bsod: ["BSOD", "Un lutin espi\xE8gle tout droit sorti d\u2019un \xE9cran bleu."],
  "null-signal": ["Null Signal", "Une douce r\xE9ponse venue du n\xE9ant."]
};
var de2 = {
  codex: ["Codex", "Der originale Codex-Gef\xE4hrte."],
  dewey: ["Dewey", "Ein ruhiger Begleiter f\xFCr konzentrierte Arbeitstage."],
  fireball: ["Fireball", "Voller Energie f\xFCr schnelle Iterationen."],
  hoots: ["Hoots", "Eine scharf\xE4ugige Eule f\xFCr den perfekten Feinschliff."],
  rocky: ["Rocky", "Felsenfeste Begleitung, selbst bei riesigen Diffs."],
  seedy: ["Seedy", "Frisches Gr\xFCn, um neue Ideen sprie\xDFen zu lassen."],
  stacky: ["Stacky", "Stabil gestapelt f\xFCr tiefes, fokussiertes Arbeiten."],
  bsod: ["BSOD", "Ein schelmischer kleiner Bluescreen-Gremlin."],
  "null-signal": ["Null Signal", "Ein leises Signal aus der Leere."]
};
var ru2 = {
  codex: ["Codex", "\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u0438\u0442\u043E\u043C\u0435\u0446 Codex."],
  dewey: ["\u0414\u044C\u044E\u0438", "\u0421\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u044C\u043E\u043D \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0434\u043D\u0435\u0439."],
  fireball: ["\u041E\u0433\u043E\u043D\u0451\u043A", "\u042D\u043D\u0435\u0440\u0433\u0438\u0447\u043D\u044B\u0439 \u0441\u043F\u0443\u0442\u043D\u0438\u043A \u0434\u043B\u044F \u0431\u044B\u0441\u0442\u0440\u043E\u0439 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438."],
  hoots: ["\u0413\u0443\u0433\u0443", "\u0417\u043E\u0440\u043A\u0430\u044F \u0441\u043E\u0432\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0442\u043E\u0447\u0438\u0442\u044C \u043A\u0430\u0436\u0434\u0443\u044E \u0434\u0435\u0442\u0430\u043B\u044C."],
  rocky: ["\u0420\u043E\u043A\u043A\u0438", "\u041D\u0430\u0434\u0451\u0436\u043D\u0430\u044F \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u043F\u0440\u0438 \u043B\u044E\u0431\u044B\u0445 \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u043D\u044B\u0445 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F\u0445."],
  seedy: ["\u0420\u043E\u0441\u0442\u043E\u043A", "\u0417\u0435\u043B\u0451\u043D\u044B\u0439 \u0440\u043E\u0441\u0442\u043E\u043A \u0434\u043B\u044F \u043D\u043E\u0432\u044B\u0445 \u0441\u043C\u0435\u043B\u044B\u0445 \u0438\u0434\u0435\u0439."],
  stacky: ["\u0421\u0442\u044D\u043A\u0438", "\u0423\u0432\u0435\u0440\u0435\u043D\u043D\u0430\u044F \u0441\u0442\u043E\u043F\u043A\u0430 \u0434\u043B\u044F \u0433\u043B\u0443\u0431\u043E\u043A\u043E\u0439 \u0441\u043E\u0441\u0440\u0435\u0434\u043E\u0442\u043E\u0447\u0435\u043D\u043D\u043E\u0439 \u0440\u0430\u0431\u043E\u0442\u044B."],
  bsod: ["BSOD", "\u041E\u0437\u043E\u0440\u043D\u043E\u0439 \u0433\u0440\u0435\u043C\u043B\u0438\u043D \u0441 \u0441\u0438\u043D\u0435\u0433\u043E \u044D\u043A\u0440\u0430\u043D\u0430 \u0441\u043C\u0435\u0440\u0442\u0438."],
  "null-signal": ["Null Signal", "\u0422\u0438\u0445\u0438\u0439 \u043E\u0442\u043A\u043B\u0438\u043A \u0438\u0437 \u0446\u0438\u0444\u0440\u043E\u0432\u043E\u0439 \u043F\u0443\u0441\u0442\u043E\u0442\u044B."]
};
var pt2 = {
  codex: ["Codex", "O companheiro original do Codex."],
  dewey: ["Dewey", "Um companheiro tranquilo para dias de trabalho focado."],
  fireball: ["Fireball", "Energia viva para acelerar o desenvolvimento."],
  hoots: ["Hoots", "Uma coruja atenta para aperfei\xE7oar cada detalhe."],
  rocky: ["Rocky", "Uma rocha firme quando as altera\xE7\xF5es aumentam."],
  seedy: ["Seedy", "Pequenos brotos verdes para florescer novas ideias."],
  stacky: ["Stacky", "Uma pilha est\xE1vel para focar no trabalho profundo."],
  bsod: ["BSOD", "Um pequeno duende travesso da tela azul."],
  "null-signal": ["Null Signal", "Um sinal tranquilo vindo do vazio."]
};
var petDictionaries = {
  zh: zh2,
  ja: ja2,
  es: es2,
  fr: fr2,
  de: de2,
  ru: ru2,
  pt: pt2
};
function localizePet(pet, locale) {
  if (pet.source !== "builtin") return pet;
  const entry = BUILTINS.find(([id]) => id === pet.id);
  if (!entry) return pet;
  const lang = normalizeLanguage(locale);
  if (lang === "en") {
    return { ...pet, name: entry[1], description: entry[2] };
  }
  const dict = petDictionaries[lang];
  if (dict && dict[entry[0]]) {
    const [name2, description] = dict[entry[0]];
    return { ...pet, name: name2, description };
  }
  return { ...pet, name: entry[1], description: entry[2] };
}

// node_modules/.pnpm/@radix-ui+react-icons@1.3.2_react@18.3.1/node_modules/@radix-ui/react-icons/dist/react-icons.esm.js
var import_react3 = require("react");
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
var _excluded$i = ["color"];
var ArrowTopRightIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$i);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$W = ["color"];
var ChevronDownIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$W);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$1r = ["color"];
var Cross2Icon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$1r);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$3a = ["color"];
var MixerHorizontalIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$3a);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M5.5 3C4.67157 3 4 3.67157 4 4.5C4 5.32843 4.67157 6 5.5 6C6.32843 6 7 5.32843 7 4.5C7 3.67157 6.32843 3 5.5 3ZM3 5C3.01671 5 3.03323 4.99918 3.04952 4.99758C3.28022 6.1399 4.28967 7 5.5 7C6.71033 7 7.71978 6.1399 7.95048 4.99758C7.96677 4.99918 7.98329 5 8 5H13.5C13.7761 5 14 4.77614 14 4.5C14 4.22386 13.7761 4 13.5 4H8C7.98329 4 7.96677 4.00082 7.95048 4.00242C7.71978 2.86009 6.71033 2 5.5 2C4.28967 2 3.28022 2.86009 3.04952 4.00242C3.03323 4.00082 3.01671 4 3 4H1.5C1.22386 4 1 4.22386 1 4.5C1 4.77614 1.22386 5 1.5 5H3ZM11.9505 10.9976C11.7198 12.1399 10.7103 13 9.5 13C8.28967 13 7.28022 12.1399 7.04952 10.9976C7.03323 10.9992 7.01671 11 7 11H1.5C1.22386 11 1 10.7761 1 10.5C1 10.2239 1.22386 10 1.5 10H7C7.01671 10 7.03323 10.0008 7.04952 10.0024C7.28022 8.8601 8.28967 8 9.5 8C10.7103 8 11.7198 8.8601 11.9505 10.0024C11.9668 10.0008 11.9833 10 12 10H13.5C13.7761 10 14 10.2239 14 10.5C14 10.7761 13.7761 11 13.5 11H12C11.9833 11 11.9668 10.9992 11.9505 10.9976ZM8 10.5C8 9.67157 8.67157 9 9.5 9C10.3284 9 11 9.67157 11 10.5C11 11.3284 10.3284 12 9.5 12C8.67157 12 8 11.3284 8 10.5Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$3x = ["color"];
var PlusIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$3x);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$3A = ["color"];
var QuestionMarkCircledIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$3A);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M0.877075 7.49972C0.877075 3.84204 3.84222 0.876892 7.49991 0.876892C11.1576 0.876892 14.1227 3.84204 14.1227 7.49972C14.1227 11.1574 11.1576 14.1226 7.49991 14.1226C3.84222 14.1226 0.877075 11.1574 0.877075 7.49972ZM7.49991 1.82689C4.36689 1.82689 1.82708 4.36671 1.82708 7.49972C1.82708 10.6327 4.36689 13.1726 7.49991 13.1726C10.6329 13.1726 13.1727 10.6327 13.1727 7.49972C13.1727 4.36671 10.6329 1.82689 7.49991 1.82689ZM8.24993 10.5C8.24993 10.9142 7.91414 11.25 7.49993 11.25C7.08571 11.25 6.74993 10.9142 6.74993 10.5C6.74993 10.0858 7.08571 9.75 7.49993 9.75C7.91414 9.75 8.24993 10.0858 8.24993 10.5ZM6.05003 6.25C6.05003 5.57211 6.63511 4.925 7.50003 4.925C8.36496 4.925 8.95003 5.57211 8.95003 6.25C8.95003 6.74118 8.68002 6.99212 8.21447 7.27494C8.16251 7.30651 8.10258 7.34131 8.03847 7.37854L8.03841 7.37858C7.85521 7.48497 7.63788 7.61119 7.47449 7.73849C7.23214 7.92732 6.95003 8.23198 6.95003 8.7C6.95004 9.00376 7.19628 9.25 7.50004 9.25C7.8024 9.25 8.04778 9.00601 8.05002 8.70417L8.05056 8.7033C8.05924 8.6896 8.08493 8.65735 8.15058 8.6062C8.25207 8.52712 8.36508 8.46163 8.51567 8.37436L8.51571 8.37433C8.59422 8.32883 8.68296 8.27741 8.78559 8.21506C9.32004 7.89038 10.05 7.35382 10.05 6.25C10.05 4.92789 8.93511 3.825 7.50003 3.825C6.06496 3.825 4.95003 4.92789 4.95003 6.25C4.95003 6.55376 5.19628 6.8 5.50003 6.8C5.80379 6.8 6.05003 6.55376 6.05003 6.25Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$3E = ["color"];
var ReloadIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$3E);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M1.84998 7.49998C1.84998 4.66458 4.05979 1.84998 7.49998 1.84998C10.2783 1.84998 11.6515 3.9064 12.2367 5H10.5C10.2239 5 10 5.22386 10 5.5C10 5.77614 10.2239 6 10.5 6H13.5C13.7761 6 14 5.77614 14 5.5V2.5C14 2.22386 13.7761 2 13.5 2C13.2239 2 13 2.22386 13 2.5V4.31318C12.2955 3.07126 10.6659 0.849976 7.49998 0.849976C3.43716 0.849976 0.849976 4.18537 0.849976 7.49998C0.849976 10.8146 3.43716 14.15 7.49998 14.15C9.44382 14.15 11.0622 13.3808 12.2145 12.2084C12.8315 11.5806 13.3133 10.839 13.6418 10.0407C13.7469 9.78536 13.6251 9.49315 13.3698 9.38806C13.1144 9.28296 12.8222 9.40478 12.7171 9.66014C12.4363 10.3425 12.0251 10.9745 11.5013 11.5074C10.5295 12.4963 9.16504 13.15 7.49998 13.15C4.05979 13.15 1.84998 10.3354 1.84998 7.49998Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$3F = ["color"];
var ResetIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$3F);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M4.85355 2.14645C5.04882 2.34171 5.04882 2.65829 4.85355 2.85355L3.70711 4H9C11.4853 4 13.5 6.01472 13.5 8.5C13.5 10.9853 11.4853 13 9 13H5C4.72386 13 4.5 12.7761 4.5 12.5C4.5 12.2239 4.72386 12 5 12H9C10.933 12 12.5 10.433 12.5 8.5C12.5 6.567 10.933 5 9 5H3.70711L4.85355 6.14645C5.04882 6.34171 5.04882 6.65829 4.85355 6.85355C4.65829 7.04882 4.34171 7.04882 4.14645 6.85355L2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});
var _excluded$4d = ["color"];
var StopIcon = /* @__PURE__ */ (0, import_react3.forwardRef)(function(_ref, forwardedRef) {
  var _ref$color = _ref.color, color = _ref$color === void 0 ? "currentColor" : _ref$color, props = _objectWithoutPropertiesLoose(_ref, _excluded$4d);
  return (0, import_react3.createElement)("svg", Object.assign({
    width: "15",
    height: "15",
    viewBox: "0 0 15 15",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props, {
    ref: forwardedRef
  }), (0, import_react3.createElement)("path", {
    d: "M2 3C2 2.44772 2.44772 2 3 2H12C12.5523 2 13 2.44772 13 3V12C13 12.5523 12.5523 13 12 13H3C2.44772 13 2 12.5523 2 12V3ZM12 3H3V12H12V3Z",
    fill: color,
    fillRule: "evenodd",
    clipRule: "evenodd"
  }));
});

// src/notification-tray.tsx
var import_react4 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function RequestForm({ item, command, language }) {
  const t = translator(language ?? "zh");
  const [answers, setAnswers] = (0, import_react4.useState)({ answers: (item.request?.questions ?? []).map((q) => ({ id: q.id, selected: [] })) });
  const [busy, setBusy] = (0, import_react4.useState)(false), [error, setError] = (0, import_react4.useState)("");
  const request2 = item.request;
  const run = async (value) => {
    setBusy(true);
    setError("");
    try {
      await command(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("\u63D0\u4EA4\u5931\u8D25"));
    } finally {
      setBusy(false);
    }
  };
  const base = { id: item.id, token: item.token, requestKey: request2.key };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dcp-request", children: [
    request2.kind === "approval" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: request2.toolName ?? t("\u5DE5\u5177\u5BA1\u6279") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: request2.reason ?? t("\u6B64\u5DE5\u5177\u9700\u8981\u4F60\u7684\u6279\u51C6\u3002") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { disabled: busy, onClick: () => void run({ ...base, type: "reject" }), children: t("\u62D2\u7EDD") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { disabled: busy, onClick: () => void run({ ...base, type: "approve" }), children: t("\u4EC5\u5141\u8BB8\u4E00\u6B21") })
    ] }) : request2.questions ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { onSubmit: (event) => {
      event.preventDefault();
      void run({ ...base, type: "answer", answers });
    }, children: [
      request2.questions.map((q, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("fieldset", { disabled: busy, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("legend", { children: q.question }),
        q.detail && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: q.detail }),
        q.options?.map((option) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: q.multiSelect ? "checkbox" : "radio", name: q.id, checked: answers.answers[index].selected.includes(option.label), onChange: (event) => setAnswers((old) => ({ answers: old.answers.map((a, i) => i !== index ? a : { ...a, custom: q.multiSelect ? a.custom : "", selected: q.multiSelect ? event.target.checked ? [...a.selected, option.label] : a.selected.filter((v) => v !== option.label) : [option.label] }) })) }),
          option.label,
          option.description && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: option.description })
        ] }, option.label)),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { "aria-label": t("{question}\uFF1A\u6587\u5B57\u56DE\u7B54", { question: q.question }), value: answers.answers[index].custom ?? "", maxLength: 1e4, placeholder: t("\u8F93\u5165\u56DE\u7B54\u6216\u8865\u5145\u8BF4\u660E"), onChange: (event) => setAnswers((old) => ({ answers: old.answers.map((a, i) => i !== index ? a : { ...a, selected: q.multiSelect ? a.selected : [], custom: event.target.value }) })) })
      ] }, q.id)),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { disabled: busy, type: "submit", children: t("\u63D0\u4EA4\u56DE\u7B54") })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: t("\u8BF7\u6253\u5F00\u4F1A\u8BDD\u5904\u7406\u6B64\u8BF7\u6C42\u3002") }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "alert", children: t(error) })
  ] });
}
function NotificationTray({ state, command, language }) {
  const t = translator(language ?? "zh");
  const [expanded, setExpanded] = (0, import_react4.useState)(false), [detail, setDetail] = (0, import_react4.useState)(null);
  const [error, setError] = (0, import_react4.useState)("");
  const [latest, setLatest] = (0, import_react4.useState)(false);
  const run = async (value) => {
    setError("");
    try {
      await command(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("\u64CD\u4F5C\u5931\u8D25"));
    }
  };
  const visible = expanded ? state.items : state.items.slice(0, 1);
  if (state.items.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "dcp-tray", "aria-label": t("\u5BA0\u7269\u4F1A\u8BDD\u901A\u77E5"), children: [
    state.items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "dcp-tray-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "dcp-tray-toggle", "aria-label": expanded ? t("\u6536\u8D77\u4F1A\u8BDD") : t("\u5C55\u5F00\u4F1A\u8BDD"), "aria-expanded": expanded, onClick: () => setExpanded(!expanded), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t("\u4F1A\u8BDD") }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dcp-tray-count", children: state.items.length }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ChevronDownIcon, { className: expanded ? "is-expanded" : "" })
      ] }),
      expanded && state.items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dcp-tray-sort", "aria-label": t("\u6700\u65B0\u4F18\u5148"), "aria-pressed": latest, title: latest ? t("\u6700\u65B0\u6D3B\u52A8\u4F18\u5148") : t("\u5F85\u5904\u7406\u4E8B\u9879\u4F18\u5148"), onClick: () => {
        setLatest(!latest);
        void run({ type: "sort", latest: !latest });
      }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MixerHorizontalIcon, {}) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dcp-notice-list", role: "list", children: visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { role: "listitem", "data-status": item.pose, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dcp-notice-dismiss", "aria-label": t("\u5173\u95ED\u901A\u77E5\uFF1A{title}", { title: item.title }), title: t("\u5173\u95ED\u672C\u8F6E\u63D0\u9192\uFF0C\u4EFB\u52A1\u7EE7\u7EED\u8FD0\u884C"), onClick: () => void run({ type: "dismiss", id: item.id, token: item.token }), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Cross2Icon, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dcp-notice-card", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { className: "dcp-bubble-link", title: item.title, onClick: () => void run({ type: "open", id: item.id, token: item.token }), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: t(item.title || "\u5F53\u524D\u4EFB\u52A1") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: t(item.text) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dcp-notice-actions", children: [
          item.request ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dcp-notice-action", "aria-label": t("\u5904\u7406\u8BF7\u6C42\uFF1A{title}", { title: item.title }), title: t("\u67E5\u770B\u5E76\u5904\u7406"), "aria-expanded": detail === item.request.key, onClick: () => {
            setExpanded(true);
            setDetail(detail === item.request.key ? null : item.request.key);
          }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(QuestionMarkCircledIcon, {}) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dcp-notice-action", "aria-label": t("\u56DE\u590D\u4F1A\u8BDD\uFF1A{title}", { title: item.title }), title: t("\u6253\u5F00\u4F1A\u8BDD\u56DE\u590D"), onClick: () => void run({ type: "open", id: item.id, token: item.token }), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ResetIcon, {}) }),
          item.pose === "running" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "dcp-notice-action", "aria-label": t("\u505C\u6B62\u5F53\u524D\u8F6E\u6B21\uFF1A{title}", { title: item.title }), title: t("\u505C\u6B62\u5F53\u524D\u8F6E\u6B21"), onClick: () => void run({ type: "stop", id: item.id, token: item.token }), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(StopIcon, {}) })
        ] })
      ] }),
      item.request && detail === item.request.key && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RequestForm, { item, command, language }, item.request.key)
    ] }, item.id)) }),
    !expanded && state.items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setExpanded(true), children: state.items.length === 2 ? t("\u8FD8\u6709 1 \u4E2A\u4F1A\u8BDD") : t("\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD", { count: state.items.length - 1 }) }),
    expanded && state.hidden > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => void run({ type: "restore" }), children: state.hidden === 1 ? t("\u6062\u590D 1 \u6761\u5DF2\u5173\u95ED\u901A\u77E5") : t("\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5", { count: state.hidden }) }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "alert", children: t(error) })
  ] });
}
var trayStyles = `.dcp-tray{pointer-events:auto;position:absolute;right:var(--tray-right,0);left:var(--tray-left,auto);top:var(--tray-top,auto);bottom:var(--tray-bottom,calc(100% + 12px));width:min(296px,calc(100vw - 24px));max-height:var(--tray-height,360px);display:flex;flex-direction:column;overflow:auto;background:var(--pet-card);color:var(--pet-text);border:1px solid var(--pet-line);border-radius:16px;padding:10px;box-shadow:0 6px 28px #0003;font-size:12px}.dcp-tray header,.dcp-notice-heading{display:flex;justify-content:space-between;gap:6px;align-items:center}.dcp-tray article{border-top:1px solid var(--pet-line);padding:8px 0}.dcp-tray button{border-radius:7px;padding:6px!important;white-space:normal;text-align:left}.dcp-tray strong,.dcp-tray span{display:block;overflow-wrap:anywhere}.dcp-tray span,.dcp-tray small{color:var(--pet-muted)}.dcp-tray .dcp-bubble-link{min-width:0;flex:1}.dcp-tray fieldset{min-width:0;border:1px solid var(--pet-line);margin:8px 0;padding:8px}.dcp-tray label{display:block}.dcp-tray label small{display:block;padding-left:20px}.dcp-tray textarea,.dcp-tray select{width:100%;box-sizing:border-box;background:var(--pet-bg);color:var(--pet-text);border:1px solid var(--pet-line);padding:7px;border-radius:6px;font:inherit;margin:5px 0}.dcp-tray textarea{min-height:54px;resize:vertical}.dcp-tray pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;max-height:180px;overflow:auto}.dcp-tray [role=alert]{color:#ef6565}.dcp-tray button:focus-visible,.dcp-tray input:focus-visible{outline:2px solid #4f8fff;outline-offset:2px}`;
var polishedTrayStyles = `
.dcp-tray{width:min(224px,calc(100vw - 24px));padding:6px;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:auto;scrollbar-width:none;font-family:inherit}
.dcp-tray .dcp-tray-toolbar{min-height:24px;padding:0 3px 3px;gap:8px}
.dcp-tray .dcp-tray-toggle{display:flex;align-items:center;gap:6px;padding:3px 5px!important;color:var(--pet-muted);font-size:11px}.dcp-tray .dcp-tray-count{font-size:10px}.dcp-tray .dcp-tray-toggle svg{width:12px;height:12px;opacity:.65}.dcp-tray .dcp-tray-toggle svg.is-expanded{transform:rotate(180deg)}
.dcp-tray .dcp-tray-sort{display:flex;align-items:center;justify-content:center;width:24px;height:24px;padding:5px!important;color:var(--pet-muted)}.dcp-tray-sort[aria-pressed=true]{background:color-mix(in srgb,var(--pet-text) 9%,transparent)}
.dcp-tray article{position:relative;padding:0;border:0;margin:5px 0 10px}.dcp-tray article:last-child{margin-bottom:0}
.dcp-tray .dcp-notice-card{display:flex;align-items:center;gap:5px;min-height:54px;padding:7px 10px 7px 19px;border-radius:28px;border:1px solid color-mix(in srgb,var(--pet-text) 14%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--pet-text) 2%,transparent),transparent),var(--pet-card);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--pet-text) 8%,transparent),0 5px 12px #0003}
.dcp-tray .dcp-bubble-link{display:block;min-width:0;flex:1;padding:0!important;border-radius:4px;line-height:1.35}.dcp-tray .dcp-bubble-link:hover{background:transparent}.dcp-tray .dcp-bubble-link strong{font-size:12px;font-weight:600;line-height:1.4;color:var(--pet-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dcp-tray .dcp-bubble-link>span{font-size:11px;line-height:1.4;margin-top:1px;color:var(--pet-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dcp-tray .dcp-notice-actions{display:flex;align-items:center;flex-shrink:0;gap:6px}.dcp-tray .dcp-notice-action{display:flex;align-items:center;justify-content:center;flex-shrink:0;width:28px;height:28px;padding:6px!important;border-radius:50%;background:color-mix(in srgb,var(--pet-text) 8%,transparent);color:var(--pet-muted)}.dcp-tray .dcp-notice-action svg{width:15px;height:15px}.dcp-tray .dcp-notice-action:hover{background:color-mix(in srgb,var(--pet-text) 15%,transparent);color:var(--pet-text)}
.dcp-tray .dcp-notice-dismiss{position:absolute;z-index:1;left:-3px;top:-3px;display:flex;align-items:center;justify-content:center;width:19px;height:19px;padding:4px!important;border-radius:50%;border:1px solid color-mix(in srgb,var(--pet-text) 22%,transparent);background:var(--pet-bg);color:var(--pet-muted)}.dcp-tray .dcp-notice-dismiss svg{width:10px;height:10px}.dcp-tray .dcp-notice-dismiss:hover{background:var(--pet-card);color:var(--pet-text)}
.dcp-tray .dcp-request{margin-top:7px;padding:10px;background:var(--pet-card);border:1px solid var(--pet-line);border-radius:14px}.dcp-tray .dcp-request p{overflow-wrap:anywhere}.dcp-tray .dcp-request button{background:color-mix(in srgb,var(--pet-text) 6%,transparent);margin:3px}
`;

// src/ui.tsx
var import_react5 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/styles.ts
var styles = `
.dcp{--pet-bg:var(--dsw-alias-bg-base,#181818);--pet-card:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#242424));--pet-line:var(--dsw-alias-border-l2,#343434);--pet-text:var(--dsw-alias-label-primary,#d7d7d7);--pet-muted:var(--dsw-alias-label-secondary,#929292);font-family:var(--dsw-font-family,Arial,"Microsoft YaHei",sans-serif);color:var(--pet-text);font-size:13px;line-height:1.45;color-scheme:inherit}
.dcp *{box-sizing:border-box}.dcp input,.dcp textarea{font:inherit}.dcp button:disabled{opacity:.4;cursor:not-allowed}.dcp button:focus-visible,.dcp input:focus-visible,.dcp textarea:focus-visible{outline:var(--dsw-focus-ring-width,1px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#9bc8ff));outline-offset:2px}.dcp-pet-button,.dcp-bubble,.dcp-menu button,.dcp-tray button{font:inherit;color:var(--pet-text);cursor:pointer}.dcp-pet-button,.dcp-bubble,.dcp-menu button,.dcp-tray button{border:0;background:transparent}.dcp-menu button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--pet-text) 8%,transparent))}
.dcp-page{box-sizing:border-box;display:flex;flex-direction:column;gap:14px;width:100%;min-width:0;padding:2px 0 36px;font-size:14px;line-height:1.5;container-type:inline-size}.dcp-page h1{font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;margin:0}.dcp-page h2{font-size:14px;line-height:22px;font-weight:600;margin:0}.dcp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.dcp-sub{color:var(--dsw-alias-label-tertiary,var(--pet-muted));margin:4px 0 0;font-size:14px;line-height:22px}.dcp-actions{display:flex;align-items:center;gap:8px}.dcp-icon-button{width:22px;min-width:22px;height:22px;padding:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-secondary,#b9b9b9);border-color:var(--dsw-alias-border-l2)}.dcp-icon-button:hover:not(:disabled){color:var(--dsw-alias-link,#4176e6);border-color:var(--dsw-alias-link,#4176e6)}.dcp svg{width:16px;height:16px;flex-shrink:0}
.dcp-card{border:0.5px solid var(--pet-line);border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-1,var(--pet-card));overflow:hidden;padding:0 14px}.dcp-row{display:flex;align-items:center;gap:12px;min-height:76px;border-bottom:0.5px solid var(--dsw-alias-border-l1,var(--pet-line))}.dcp-preview{width:52px;flex-shrink:0;display:flex;justify-content:center;align-items:center}.dcp-info{flex:1;min-width:0}.dcp-name{font-size:14px;font-weight:650;margin-bottom:3px}.dcp-description{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,var(--pet-muted));overflow-wrap:anywhere}.dcp-folder{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.dcp-path{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary,var(--pet-muted));overflow-wrap:anywhere}.dcp-folder-button{white-space:nowrap}.dcp-appearance{display:flex;flex-direction:column;gap:14px}.dcp-size{min-height:62px;display:flex;align-items:center;justify-content:space-between;padding:12px 16px}.dcp-size label{font-weight:600}.dcp-size input{width:160px;height:2px;accent-color:var(--dsw-alias-brand-primary,#fff);cursor:pointer}.dcp-size small{display:block;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,var(--pet-muted));font-weight:400;margin-top:2px}.dcp-note{margin:0;color:var(--dsw-alias-label-tertiary,var(--pet-muted));font-size:11px;line-height:17px}.dcp-error{padding:12px 14px;border:0.5px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#ed7272) 40%,transparent);border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-state-error-primary,#edb7a3);margin:0;font-size:12px;line-height:18px}.dcp-empty{padding:25px 14px;text-align:center;color:var(--dsw-alias-label-tertiary,var(--pet-muted));font-size:12px;line-height:18px}
.dcp-floating{position:fixed;z-index:2147483000;pointer-events:none}.dcp-pet-button{display:block!important;padding:0!important;background:transparent!important;touch-action:none;cursor:grab!important;pointer-events:auto;user-select:none;-webkit-user-select:none}.dcp-pet-button:active{cursor:grabbing!important}.dcp-sprite{background-repeat:no-repeat;pointer-events:none;flex-shrink:0}.dcp-bubble{position:absolute;bottom:calc(100% + 16px);right:0;min-width:160px;max-width:240px;width:max-content;padding:10px 16px!important;border:1px solid var(--pet-line)!important;border-radius:28px!important;background:var(--pet-card)!important;text-align:left;box-shadow:0 2px 12px #0002;pointer-events:auto}.dcp-bubble strong{display:block;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.dcp-bubble span{display:block;font-size:12px;color:var(--pet-muted)}.dcp-menu{position:absolute;right:0;bottom:100%;width:160px;padding:6px;border:1px solid var(--pet-line);background:var(--pet-card);border-radius:10px;pointer-events:auto;box-shadow:0 8px 32px #0004}.dcp-menu button{display:block;width:100%;text-align:left;padding:8px;border-radius:5px}.dcp-menu hr{border:0;border-top:1px solid var(--pet-line);margin:5px}
.dcp-dialog{color:var(--pet-text);background:var(--dsw-alias-bg-layer-2,var(--pet-card));border:0;border-radius:var(--dsw-radius-panel,16px);width:min(480px,calc(100vw - 32px));padding:24px;box-shadow:var(--dsw-elevation-prominent,0 16px 48px #0004)}.dcp-dialog[open]{display:flex;flex-direction:column;gap:12px}.dcp-dialog-close{align-self:flex-start}.dcp-dialog::backdrop{background:var(--dsw-alias-bg-mask-1,#0008);backdrop-filter:var(--dsw-mask-blur,none)}.dcp-settings-modal{width:min(800px,100%)!important;max-height:calc(100vh - 48px);padding:0!important;gap:0!important;overflow:hidden}.dcp-settings-modal-body{box-sizing:border-box;display:flex;flex-direction:column;gap:12px;max-height:calc(100vh - 48px);overflow:auto;padding:24px}.dcp-create-dialog h2{font-size:16px;line-height:24px;font-weight:500;margin:0 0 12px}.dcp textarea.dcp-textarea{display:block;resize:vertical;width:100%;min-height:120px;color:var(--pet-text);background:var(--dsw-alias-bg-layer-1,var(--pet-bg));border:0.5px solid var(--dsw-alias-border-l4,var(--pet-line));border-radius:var(--dsw-radius-md,12px);padding:8px 12px;margin:16px 0;font-size:14px;line-height:22px}.dcp textarea.dcp-textarea:focus{outline:none;border-color:var(--dsw-alias-state-business-primary,var(--pet-line))}.dcp-dialog footer{display:flex;justify-content:flex-end;gap:8px}.dcp-creation{border-top:0.5px solid var(--pet-line);padding-top:12px}
.dcp-size input{-webkit-appearance:none;appearance:none;background:var(--pet-line);height:2px}.dcp-size input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-brand-primary,var(--pet-text))}
@container(max-width:520px){.dcp-page h1{font-size:22px}.dcp-head{flex-wrap:wrap;gap:10px}.dcp-row{min-height:68px;gap:8px}.dcp-preview{width:44px}.dcp-description{font-size:11px}.dcp-card{padding:0 12px}.dcp-folder{align-items:flex-start}.dcp-size{padding:12px}.dcp-size input{width:130px}}
@media(prefers-reduced-motion:reduce){.dcp *{animation:none!important;transition:none!important}}
`;

// src/sprite-clock.ts
function runSpriteClock(options) {
  const { durations, timer, hidden, onVisible, onFrame } = options;
  const count = durations.length;
  let frame = 0;
  let handle = null;
  let live = true;
  const stop = () => {
    if (handle === null) return;
    timer.clearTimeout(handle);
    handle = null;
  };
  const advance = () => {
    handle = timer.setTimeout(() => {
      handle = null;
      if (!live || hidden()) return;
      frame = (frame + 1) % count;
      onFrame(frame);
      advance();
    }, durations[frame] ?? 0);
  };
  const resume = () => {
    if (!live || !options.animate || hidden()) return;
    stop();
    advance();
  };
  const off = onVisible(resume);
  if (options.animate && count > 0 && !hidden()) advance();
  return () => {
    live = false;
    off();
    stop();
  };
}

// src/ui.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
async function request(path, data) {
  const response = await fetch(`${BASE}/api/${path}`, {
    method: data === void 0 ? "GET" : "POST",
    headers: data === void 0 ? void 0 : { "content-type": "application/json", "x-dsh-pet": "1" },
    body: data === void 0 ? void 0 : JSON.stringify(data),
    signal: AbortSignal.timeout(15e3)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "\u5BA0\u7269\u670D\u52A1\u6682\u4E0D\u53EF\u7528");
  return result;
}
var libraryStore = createLibraryStore(request);
function usePetController(locale) {
  const language = (0, import_react5.useSyncExternalStore)(
    (listener) => locale ? locale.subscribe(listener) : () => {
    },
    () => locale?.getSnapshot().active ?? "zh"
  );
  const { library, error } = (0, import_react5.useSyncExternalStore)(
    libraryStore.subscribe,
    libraryStore.getSnapshot
  );
  const localizedLibrary = (0, import_react5.useMemo)(
    () => library ? {
      ...library,
      pets: library.pets.map((pet) => localizePet(pet, language))
    } : null,
    [library, language]
  );
  return {
    library: localizedLibrary,
    language,
    error,
    update: (value) => libraryStore.run("config", value),
    refresh: () => libraryStore.run("refresh", {}),
    folder: () => libraryStore.run("open-folder", {})
  };
}
function Sprite({
  pet,
  size,
  pose = "idle",
  animate = false,
  look = null
}) {
  const element = (0, import_react5.useRef)(null);
  (0, import_react5.useEffect)(() => {
    const node = element.current;
    if (!node) return;
    const animation = ANIMATIONS[pose];
    let frame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paint = () => {
      const row = pet.version === 2 && look ? look.row : animation.row;
      const col = pet.version === 2 && look ? look.col : frame;
      node.style.backgroundPosition = `${-col * size}px ${-row * size * 208 / 192}px`;
    };
    paint();
    const stopClock = runSpriteClock({
      durations: animation.durations,
      animate: animate && !look && !reduced.matches,
      timer: {
        setTimeout: (callback, delay) => window.setTimeout(callback, delay),
        clearTimeout: (id) => window.clearTimeout(id)
      },
      hidden: () => document.hidden,
      onVisible: (resume) => {
        document.addEventListener("visibilitychange", resume);
        return () => document.removeEventListener("visibilitychange", resume);
      },
      onFrame: (next) => {
        frame = next;
        paint();
      }
    });
    return stopClock;
  }, [pet.id, pet.version, size, pose, animate, look]);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "div",
    {
      ref: element,
      className: "dcp-sprite",
      style: {
        width: size,
        height: size * 208 / 192,
        backgroundImage: `url("${pet.url}")`,
        backgroundSize: `${size * 8}px ${size * 208 / 192 * (pet.version === 2 ? 11 : 9)}px`
      }
    }
  );
}
function Settings({
  controller,
  create,
  locale,
  draft
}) {
  const t = translator(controller.language);
  const { library, error } = controller;
  const [busy, setBusy] = (0, import_react5.useState)(false), [showCreate, setShowCreate] = (0, import_react5.useState)(false), [description, setDescription] = (0, import_react5.useState)(draft?.current ?? "");
  const changeDescription = (value) => {
    if (draft) draft.current = value;
    setDescription(value);
  };
  const [size, setSize] = (0, import_react5.useState)(library?.config.size ?? 120);
  const dialog = (0, import_react5.useRef)(null);
  const createTitleId = (0, import_react5.useId)();
  const [creationError, setCreationError] = (0, import_react5.useState)("");
  (0, import_react5.useEffect)(() => {
    if (library) setSize(library.config.size);
  }, [library?.config.size]);
  (0, import_react5.useEffect)(() => {
    if (showCreate) dialog.current?.showModal();
    else dialog.current?.close();
  }, [showCreate]);
  const act = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch {
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp dcp-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: styles }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PluginUpdateHeader, { locale }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "dcp-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: t("\u9009\u62E9\u5BA0\u7269") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dcp-sub", children: t("\u5BA0\u7269\u4F1A\u7BA1\u7406\u5BF9\u8BDD\u4E32\uFF0C\u5E76\u7A81\u51FA\u663E\u793A\u9700\u8981\u5173\u6CE8\u7684\u4E8B\u9879") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            className: "dcp-icon-button",
            title: t("\u5237\u65B0\u5BA0\u7269\u5E93"),
            "aria-label": t("\u5237\u65B0\u5BA0\u7269\u5E93"),
            disabled: busy,
            icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReloadIcon, {}),
            onClick: () => void act(controller.refresh)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            className: "dcp-icon-button",
            title: t("\u521B\u5EFA"),
            "aria-label": t("\u521B\u5EFA"),
            disabled: !library || busy,
            icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlusIcon, {}),
            onClick: () => setShowCreate(true)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            disabled: !library || busy,
            onClick: () => void act(
              () => controller.update({ visible: !library?.config.visible })
            ),
            children: library?.config.visible === false ? t("\u663E\u793A\u5BA0\u7269") : t("\u6536\u8D77\u5BA0\u7269")
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { role: "alert", className: "dcp-error", children: t(error) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp-card", children: [
      !library && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-empty", role: "status", children: t("\u6B63\u5728\u52A0\u8F7D\u5BA0\u7269\u2026") }),
      library?.pets.map((pet) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-preview", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Sprite, { pet, size: 44 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp-info", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-name", children: pet.name }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-description", children: pet.description })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            type: "button",
            variant: library.config.selected === pet.id ? "ghost" : "outline",
            size: "sm",
            "aria-label": library.config.selected === pet.id ? `${t("\u5DF2\u9009\u62E9")} ${pet.name}` : `${t("\u9009\u62E9")} ${pet.name}`,
            "aria-pressed": library.config.selected === pet.id,
            disabled: busy || library.config.selected === pet.id,
            onClick: () => void act(() => controller.update({ selected: pet.id })),
            children: library.config.selected === pet.id ? t("\u5DF2\u9009") : t("\u9009\u62E9")
          }
        )
      ] }, pet.id)),
      library?.pets.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-empty", children: t("\u5C1A\u672A\u52A0\u8F7D\u5BA0\u7269\u3002\u5185\u7F6E\u8D44\u6E90\u7F3A\u5931\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u5B8C\u6574\u63D2\u4EF6\u3002") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp-folder", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { children: t("DSH \u81EA\u5B9A\u4E49\u5BA0\u7269") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-path", children: library?.customPath ?? t("\u6B63\u5728\u8BFB\u53D6\u76EE\u5F55\u2026") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives.Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            className: "dcp-folder-button",
            disabled: !library || busy,
            icon: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ArrowTopRightIcon, {}),
            onClick: () => void act(controller.folder),
            children: t("\u6253\u5F00\u6587\u4EF6\u5939")
          }
        )
      ] })
    ] }),
    !!library?.warnings.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "dcp-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("summary", { children: library.warnings.length === 1 ? t("\u6709 1 \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5") : t("\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5", {
        count: library.warnings.length
      }) }),
      library.warnings.map((message) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: message }, message))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "dcp-appearance", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: t("\u5916\u89C2") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dcp-card dcp-size", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { htmlFor: "dcp-size", children: [
          t("\u5BA0\u7269\u5927\u5C0F"),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("small", { children: t("\u8C03\u6574\u5BA0\u7269\u5927\u5C0F") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            id: "dcp-size",
            "aria-label": t("\u5BA0\u7269\u5927\u5C0F"),
            type: "range",
            min: "64",
            max: "224",
            step: "4",
            value: size,
            disabled: !library || busy,
            onChange: (event) => setSize(Number(event.target.value)),
            onPointerUp: () => void act(() => controller.update({ size })),
            onKeyUp: () => void act(() => controller.update({ size }))
          }
        )
      ] })
    ] }),
    library?.creation && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dcp-note dcp-creation", role: "status", children: library.creation.message }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "dialog",
      {
        ref: dialog,
        className: "dcp-dialog dcp-create-dialog",
        "aria-labelledby": createTitleId,
        onCancel: () => setShowCreate(false),
        onClose: () => setShowCreate(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "form",
          {
            onSubmit: (event) => {
              event.preventDefault();
              if (!create) return;
              setBusy(true);
              setCreationError("");
              void create(description).then(() => {
                setShowCreate(false);
                changeDescription("");
              }).catch(
                (error2) => setCreationError(
                  error2 instanceof Error ? error2.message : t("\u521B\u5EFA\u5931\u8D25")
                )
              ).finally(() => setBusy(false));
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { id: createTitleId, children: t("\u521B\u5EFA\u5BA0\u7269") }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "textarea",
                {
                  className: "dcp-textarea",
                  autoFocus: true,
                  "aria-label": t("\u5BA0\u7269\u63CF\u8FF0"),
                  placeholder: t(
                    "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026"
                  ),
                  maxLength: 2e3,
                  value: description,
                  onChange: (event) => changeDescription(event.target.value),
                  required: true
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "dcp-note", children: t(
                "\u5728 DSH \u65B0\u4F1A\u8BDD\u4E2D\u4F7F\u7528\u968F\u63D2\u4EF6\u63D0\u4F9B\u7684 Skill \u521B\u5EFA\uFF0C\u6210\u54C1\u4FDD\u5B58\u5230 DSH \u5BA0\u7269\u76EE\u5F55\u3002\u9700\u8981\u5F53\u524D\u4F1A\u8BDD\u5177\u5907\u56FE\u50CF\u751F\u6210\u5DE5\u5177\u3002"
              ) }),
              !create && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "status", children: t(
                "\u8BF7\u5728 DSH \u4E3B\u754C\u9762\u7684\u5BA0\u7269\u8BBE\u7F6E\u4E2D\u53D1\u8D77\u521B\u5EFA\uFF1B\u72EC\u7ACB\u9884\u89C8\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u670D\u52A1\u3002"
              ) }),
              creationError && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", className: "dcp-error", children: t(creationError) }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("footer", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  import_dsh_client_ui_primitives.Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setShowCreate(false),
                    children: t("\u53D6\u6D88")
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  import_dsh_client_ui_primitives.Button,
                  {
                    type: "submit",
                    variant: "primary",
                    size: "sm",
                    disabled: busy || !description.trim() || !library?.skillAvailable || !create,
                    children: t("\u5728 DSH \u4E2D\u521B\u5EFA")
                  }
                )
              ] })
            ]
          }
        )
      }
    )
  ] });
}
function FloatingPet({
  pet,
  config,
  activity,
  update,
  open,
  settings,
  tray
}) {
  const t = translator(pet.displayLocale ?? "zh");
  const root = (0, import_react5.useRef)(null);
  const drag = (0, import_react5.useRef)(null);
  const [position, setPosition] = (0, import_react5.useState)({ left: 0, top: 0 }), [action, setAction] = (0, import_react5.useState)(null), [look, setLook] = (0, import_react5.useState)(null), [menu, setMenu] = (0, import_react5.useState)(false);
  const timer = (0, import_react5.useRef)(null);
  const [menuError, setMenuError] = (0, import_react5.useState)("");
  const petHeight = config.size * 208 / 192;
  const place = (0, import_react5.useCallback)(() => {
    const width = Math.max(0, innerWidth - config.size - 16), height = Math.max(0, innerHeight - petHeight - 32);
    setPosition({
      left: config.position ? config.position.x * width : width,
      top: config.position ? config.position.y * height : height
    });
  }, [config.size, config.position, petHeight]);
  (0, import_react5.useEffect)(() => {
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [place]);
  const center = (0, import_react5.useRef)(null);
  const measuredAt = (0, import_react5.useRef)(0);
  const measure = (0, import_react5.useCallback)(() => {
    const box = root.current?.getBoundingClientRect();
    center.current = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : null;
    measuredAt.current = Date.now();
  }, []);
  (0, import_react5.useEffect)(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, position.left, position.top, config.size, petHeight]);
  const perform = (0, import_react5.useCallback)((pose) => {
    if (timer.current) clearTimeout(timer.current);
    setLook(null);
    setAction(pose);
    const anim = ANIMATIONS[pose];
    timer.current = setTimeout(
      () => setAction(null),
      anim.durations.reduce((sum, value) => sum + value, 0)
    );
  }, []);
  (0, import_react5.useEffect)(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  (0, import_react5.useEffect)(() => {
    const interval = setInterval(() => {
      if (activity.pose === "idle" && !action && !drag.current && !document.hidden && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        perform(Math.random() < 0.7 ? "waving" : "jumping");
    }, 18e3);
    return () => clearInterval(interval);
  }, [activity.pose, action, perform]);
  (0, import_react5.useEffect)(() => {
    const track = (event) => {
      if (activity.pose !== "idle" || action || drag.current || pet.version !== 2) {
        setLook(null);
        return;
      }
      if (Date.now() - measuredAt.current > 500) measure();
      const origin = center.current;
      if (!origin) return;
      const cell = lookCell(
        event.clientX - origin.x,
        event.clientY - origin.y
      );
      setLook(
        (current) => current === cell || current !== null && cell !== null && current.row === cell.row && current.col === cell.col ? current : cell
      );
    };
    window.addEventListener("mousemove", track);
    return () => window.removeEventListener("mousemove", track);
  }, [activity.pose, action, pet.version, measure]);
  (0, import_react5.useEffect)(() => {
    if (!menu) return;
    const close = (event) => {
      if (!root.current?.contains(event.target)) setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);
  const persistPosition = () => update({
    position: {
      x: position.left / Math.max(1, innerWidth - config.size - 16),
      y: position.top / Math.max(1, innerHeight - petHeight - 32)
    }
  }).catch(() => {
  });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: "dcp dcp-floating",
      ref: root,
      style: {
        left: position.left,
        top: position.top,
        width: config.size,
        height: petHeight
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: styles }),
        tray && !menu && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            style: {
              ["--tray-height"]: `${Math.max(100, Math.min(420, position.top < innerHeight / 2 ? innerHeight - position.top - petHeight - 44 : position.top - 24))}px`,
              ["--tray-top"]: position.top < innerHeight / 2 ? "calc(100% + 28px)" : "auto",
              ["--tray-bottom"]: position.top < innerHeight / 2 ? "auto" : "calc(100% + 12px)",
              ["--tray-right"]: position.left < 296 - config.size ? "auto" : "0",
              ["--tray-left"]: position.left < 296 - config.size ? "0" : "auto"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: trayStyles + polishedTrayStyles }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(NotificationTray, { ...tray, language: pet.displayLocale })
            ]
          }
        ),
        !tray && activity.text && !menu && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            className: "dcp-bubble",
            style: {
              ...position.top < 84 ? { top: "calc(100% + 28px)", bottom: "auto" } : {},
              ...position.left < 240 ? { left: 0, right: "auto" } : {}
            },
            onClick: open,
            title: t("\u6253\u5F00\u5173\u8054\u4EFB\u52A1"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: t(activity.title || "\u5F53\u524D\u4EFB\u52A1") }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: t(activity.text) })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            className: "dcp-pet-button",
            "aria-label": t("{name}\uFF0C{status}\uFF1B\u62D6\u52A8\u79FB\u52A8\uFF0C\u53CC\u51FB\u8DF3\u8DC3\uFF0C\u53F3\u952E\u83DC\u5355", {
              name: pet.name,
              status: t(activity.text || "\u7A7A\u95F2")
            }),
            onContextMenu: (event) => {
              event.preventDefault();
              setMenu((value) => !value);
            },
            onPointerDown: (event) => {
              if (event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                x: event.screenX,
                y: event.screenY,
                startX: event.screenX,
                startY: event.screenY,
                left: position.left,
                top: position.top,
                moved: false
              };
              setMenu(false);
            },
            onPointerMove: (event) => {
              const point = drag.current;
              if (!point) return;
              const dx = event.screenX - point.x, dy = event.screenY - point.y;
              if (Math.hypot(
                event.screenX - point.startX,
                event.screenY - point.startY
              ) > 4)
                point.moved = true;
              if (!point.moved) return;
              setLook(null);
              setAction(dx < 0 ? "running-left" : "running-right");
              setPosition({
                left: Math.max(
                  0,
                  Math.min(
                    innerWidth - config.size - 16,
                    point.left + event.screenX - point.startX
                  )
                ),
                top: Math.max(
                  0,
                  Math.min(
                    innerHeight - petHeight - 32,
                    point.top + event.screenY - point.startY
                  )
                )
              });
              point.x = event.screenX;
              point.y = event.screenY;
            },
            onPointerUp: () => {
              const point = drag.current;
              drag.current = null;
              setAction(null);
              if (point?.moved) void persistPosition();
              else if (!point?.moved) perform("waving");
            },
            onPointerCancel: () => {
              drag.current = null;
              setAction(null);
            },
            onDoubleClick: () => perform("jumping"),
            onPointerEnter: () => {
              if (activity.pose === "idle" && !action && !drag.current)
                perform("waving");
            },
            onKeyDown: (event) => {
              if (event.key === "Escape") setMenu(false);
              if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") {
                event.preventDefault();
                setMenu(true);
              }
              if (event.key === "Enter") perform("waving");
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              Sprite,
              {
                pet,
                size: config.size,
                pose: action ?? activity.pose,
                animate: true,
                look
              }
            )
          }
        ),
        menu && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            className: "dcp-menu",
            style: {
              ...position.top < 220 ? { top: "calc(100% + 28px)", bottom: "auto" } : {},
              ...position.left < 160 ? { left: 0, right: "auto" } : {}
            },
            role: "menu",
            onKeyDown: (event) => {
              if (event.key === "Escape") setMenu(false);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  role: "menuitem",
                  onClick: () => {
                    perform("waving");
                    setMenu(false);
                  },
                  children: t("\u6253\u4E2A\u62DB\u547C")
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  role: "menuitem",
                  onClick: () => {
                    perform("jumping");
                    setMenu(false);
                  },
                  children: t("\u8DF3\u4E00\u8DF3")
                }
              ),
              !!tray?.state.hidden && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  role: "menuitem",
                  onClick: () => {
                    setMenuError("");
                    void tray.command({ type: "restore" }).then(() => setMenu(false)).catch(
                      (error) => setMenuError(
                        error instanceof Error ? error.message : t("\u6062\u590D\u5931\u8D25")
                      )
                    );
                  },
                  children: t("\u6062\u590D\u5DF2\u5173\u95ED\u901A\u77E5")
                }
              ),
              menuError && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "alert", children: t(menuError) }),
              activity.sessionId && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  role: "menuitem",
                  onClick: () => {
                    open();
                    setMenu(false);
                  },
                  children: t("\u67E5\u770B\u4EFB\u52A1")
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("hr", {}),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  role: "menuitem",
                  onClick: () => {
                    settings();
                    setMenu(false);
                  },
                  children: t("\u5BA0\u7269\u8BBE\u7F6E")
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  role: "menuitem",
                  onClick: () => {
                    void update({ visible: false }).catch(() => {
                    });
                  },
                  children: t("\u6536\u8D77\u5BA0\u7269")
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function Companion({
  controller,
  activity = IDLE,
  open = () => {
  },
  settings = () => {
  },
  tray
}) {
  const t = translator(controller.language);
  const library = controller.library;
  const selected = library?.pets.find(
    (item) => item.id === library.config.selected
  );
  const pet = (0, import_react5.useMemo)(
    () => selected ? { ...selected, displayLocale: controller.language } : void 0,
    [selected, controller.language]
  );
  if (!pet || !library?.config.visible) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    FloatingPet,
    {
      pet,
      config: library.config,
      activity,
      tray,
      update: controller.update,
      open,
      settings
    }
  );
}

// src/activity.ts
function selectedSessionId(list) {
  for (const id of list.ids) if ((list.byId[id]?.retainedBy?.mainView ?? 0) > 0) return id;
}

// src/notifications.ts
var priority = { waiting: 0, failed: 1, review: 2, running: 3 };
var lifetime = { failed: 36e5, waiting: 864e5, review: 6048e5 };
function validateAnswers(questions, value) {
  if (!value || !Array.isArray(value.answers) || value.answers.length !== questions.length) throw new Error("\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898");
  const ids = /* @__PURE__ */ new Set();
  for (const answer of value.answers) {
    const question = questions.find((q) => q.id === answer.id);
    if (!question || ids.has(answer.id) || !Array.isArray(answer.selected)) throw new Error("\u95EE\u9898\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u56DE\u7B54");
    ids.add(answer.id);
    if (new Set(answer.selected).size !== answer.selected.length || answer.selected.some((label) => !question.options?.some((option) => option.label === label))) throw new Error("\u9009\u9879\u65E0\u6548");
    if (answer.custom !== void 0 && (typeof answer.custom !== "string" || answer.custom.length > 1e4)) throw new Error("\u56DE\u7B54\u8FC7\u957F");
    if (!answer.selected.length && !answer.custom?.trim()) throw new Error("\u8BF7\u56DE\u7B54\u6240\u6709\u95EE\u9898");
    if (!question.multiSelect && (answer.selected.length > 1 || answer.selected.length > 0 && !!answer.custom?.trim())) throw new Error("\u5355\u9009\u95EE\u9898\u53EA\u80FD\u63D0\u4EA4\u4E00\u79CD\u56DE\u7B54");
  }
  return value;
}
function createNotifications(sessions, pending, notify, now = Date.now, carried = /* @__PURE__ */ new Map()) {
  const records = /* @__PURE__ */ new Map();
  const bindings = /* @__PURE__ */ new Map();
  const dismissed = carried;
  const busy = /* @__PURE__ */ new Set();
  const answered = /* @__PURE__ */ new Set();
  let state = { items: [], activity: IDLE, hidden: 0 }, latestFirst = false;
  let publishing = false;
  let lastPublished = "";
  const HOT_GRACE_MS = 3e4;
  const hotUntil = /* @__PURE__ */ new Map();
  const releaseBinding = (id) => sessions.releaseBinding?.(id);
  const publish = () => {
    if (publishing) return;
    publishing = true;
    try {
      sessions.sweepBindings?.();
      const list = sessions.list.getSnapshot(), requests = pending.getSnapshot(), statuses = sessions.status?.getSnapshot();
      const current = selectedSessionId(list);
      const stamp = now();
      const ids = new Set(list.ids.filter((id) => list.byId[id] && list.byId[id].origin !== "subagent"));
      for (const id of records.keys()) if (!ids.has(id)) {
        records.delete(id);
        dismissed.delete(id);
        hotUntil.delete(id);
      }
      for (const [id, bound] of bindings) if (!ids.has(id)) {
        bound.off();
        bindings.delete(id);
        records.delete(id);
        dismissed.delete(id);
        hotUntil.delete(id);
      }
      const items = [];
      let hidden = 0;
      for (const id of ids) {
        const row = list.byId[id];
        if (!row) continue;
        const status = statuses?.get(id);
        const request2 = requests.get(id);
        const active = !!status?.running || !!row.running || !!request2 || !!status?.pendingInteraction || !!status?.completionUnread || id === current;
        if (active) hotUntil.set(id, stamp + HOT_GRACE_MS);
        const hot = active || (hotUntil.get(id) ?? 0) > stamp;
        if (!hot) {
          hotUntil.delete(id);
          const previous2 = bindings.get(id);
          if (previous2) {
            previous2.off();
            bindings.delete(id);
          }
          releaseBinding(id);
          if (!records.has(id)) continue;
        }
        const binding = hot ? sessions.binding(id) : void 0;
        let record = records.get(id);
        if (!record) {
          record = { fresh: true, round: 0, running: row.running, completion: !!status?.completionUnread, error: null, revision: binding?.eventSource?.getSnapshot().revision ?? -1, updatedAt: row.updatedAt ?? now(), lastPose: "" };
          records.set(id, record);
        }
        const previous = bindings.get(id);
        if (binding && (previous?.binding.session !== binding.session || previous.binding.eventSource !== binding.eventSource)) {
          previous?.off();
          record.revision = binding.eventSource?.getSnapshot().revision ?? record.revision;
          const offSession = binding.session.subscribe(publish), offEvents = binding.eventSource?.subscribe(publish);
          bindings.set(id, { binding, off: () => {
            offSession();
            offEvents?.();
          } });
        }
        const snapshot = binding?.session.getSnapshot();
        const running = status?.running ?? (id === current ? snapshot?.running ?? row.running : row.running);
        if (running && !record.running) {
          record.fresh = false;
          record.round++;
          record.awaitingStart = true;
          record.finished = void 0;
          record.completion = false;
          record.error = null;
          record.suppressStopCompletion = false;
          record.updatedAt = now();
        }
        const events = binding?.eventSource?.getSnapshot();
        if (events && record.revision !== events.revision) {
          record.revision = events.revision;
          if (events.change.kind === "append") for (const entry of events.change.entries) {
            if (entry.type !== "event") continue;
            if (entry.event.type === "turn/start") {
              record.fresh = false;
              if (!record.awaitingStart) record.round++;
              record.awaitingStart = false;
              record.finished = void 0;
              record.completion = false;
              record.error = null;
            }
            if (entry.event.type === "turn/end") {
              record.finished = entry.event.data?.reason?.kind;
              record.completion = record.finished === "completed";
              record.updatedAt = now();
            }
          }
          else if (events.change.kind === "replace") record.suppressStopCompletion = true;
        }
        const stopped = !running && record.running;
        record.running = running;
        if (snapshot !== void 0) {
          const agentError = snapshot.lastAgentError ?? snapshot.promptError?.error?.message ?? null;
          if (agentError && agentError !== record.snapshotError) record.error = agentError;
          record.snapshotError = agentError;
        }
        if (stopped && !record.suppressStopCompletion && !record.finished && !record.error) {
          record.completion = true;
          record.updatedAt = now();
        }
        if (status?.completionUnread && !running && (!record.finished || record.finished === "completed")) record.completion = true;
        const activity = selectActivity([{ id, title: row.title ?? row.displayTitle, running, waiting: !!request2, error: running ? null : record.error, completed: !running && record.completion }]);
        if (activity.pose === "idle") continue;
        if (record.lastPose && record.lastPose !== activity.pose || record.requestKey !== request2?.key) record.updatedAt = now();
        record.lastPose = activity.pose;
        record.requestKey = request2?.key;
        const token = `${record.round}:${request2?.key ?? ""}`;
        const muted = dismissed.get(id);
        if (muted !== void 0 && muted.pose === activity.pose && muted.mark === (row.updatedAt ?? 0) && (muted.token === token || record.fresh === true)) {
          hidden++;
          continue;
        }
        const ttl = lifetime[activity.pose];
        if (ttl && now() - record.updatedAt >= ttl) continue;
        items.push({ ...activity, id, token, updatedAt: record.updatedAt, request: request2 && typeof request2.key === "string" ? { key: request2.key, kind: String(request2.kind), toolName: request2.toolName, reason: request2.reason, questions: request2.questions } : void 0 });
      }
      items.sort((a, b) => (latestFirst ? 0 : priority[a.pose] - priority[b.pose]) || b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
      state = { items, hidden, activity: items[0] ?? IDLE };
      const signature = JSON.stringify(state);
      if (signature !== lastPublished) {
        lastPublished = signature;
        notify(state);
      }
    } finally {
      publishing = false;
    }
  };
  const offList = sessions.list.subscribe(publish), offPending = pending.subscribe(publish), offStatus = sessions.status?.subscribe(publish);
  publish();
  const timer = setInterval(publish, 1e3);
  return {
    getSnapshot: () => state,
    sort(latest) {
      latestFirst = latest;
      publish();
    },
    async command(command) {
      if (command.type === "restore") {
        dismissed.clear();
        publish();
        return;
      }
      const item = state.items.find((item2) => item2.id === command.id && item2.token === command.token);
      if (!item) throw new Error("\u8FD9\u6761\u901A\u77E5\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u901A\u77E5");
      if (command.type === "dismiss") {
        dismissed.set(item.id, { mark: sessions.list.getSnapshot().byId[item.id]?.updatedAt ?? 0, token: item.token, pose: item.pose });
        publish();
        return;
      }
      if (command.type === "open") {
        if (!sessions.open) throw new Error("\u5BBF\u4E3B\u672A\u63D0\u4F9B\u6253\u5F00\u4F1A\u8BDD\u80FD\u529B");
        sessions.open(item.id);
        if (item.pose === "review") dismissed.set(item.id, { mark: sessions.list.getSnapshot().byId[item.id]?.updatedAt ?? 0, token: item.token, pose: item.pose });
        publish();
        return;
      }
      if (command.type === "stop") {
        if (item.pose !== "running") throw new Error("\u4EFB\u52A1\u72B6\u6001\u5DF2\u53D8\u5316");
        const session = sessions.binding(item.id)?.session;
        if (!session?.cancel) throw new Error("\u5BBF\u4E3B\u672A\u63D0\u4F9B\u505C\u6B62\u4EFB\u52A1\u80FD\u529B");
        if (busy.has(item.id)) throw new Error("\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C");
        busy.add(item.id);
        try {
          const result = await session.cancel();
          if (!result.ok) throw new Error(result.error?.message ?? "\u505C\u6B62\u5931\u8D25");
        } finally {
          busy.delete(item.id);
        }
        return;
      }
      const request2 = pending.getSnapshot().get(item.id);
      if (!request2 || request2.key !== command.requestKey || request2.sessionId && request2.sessionId !== item.id || !request2.answer) throw new Error("\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362\uFF0C\u8BF7\u67E5\u770B\u6700\u65B0\u4F1A\u8BDD");
      if (answered.has(request2.key)) throw new Error("\u8BE5\u8BF7\u6C42\u5DF2\u7ECF\u63D0\u4EA4");
      if (busy.has(item.id)) throw new Error("\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u52FF\u91CD\u590D\u64CD\u4F5C");
      let answer;
      if (request2.kind === "approval" && (command.type === "approve" || command.type === "reject")) answer = command.type === "approve" ? "allowed-once" : "rejected";
      else if ((request2.kind === "question" || request2.kind === "plan-review") && command.type === "answer") answer = validateAnswers(request2.questions ?? [], command.answers);
      else throw new Error("\u6B64\u8BF7\u6C42\u4E0D\u652F\u6301\u8BE5\u64CD\u4F5C");
      busy.add(item.id);
      try {
        await request2.answer(answer);
        answered.add(request2.key);
      } finally {
        busy.delete(item.id);
        publish();
      }
    },
    dispose() {
      offList();
      offPending();
      offStatus?.();
      clearInterval(timer);
      for (const value of bindings.values()) value.off();
      bindings.clear();
    }
  };
}

// src/creation.ts
function tryOpen(sessions, id) {
  try {
    sessions.open?.(id);
  } catch {
  }
}
async function createPetSession(sessions, description, directory, skill) {
  if (!description.trim() || description.length > 2e3) throw new Error("\u8BF7\u8F93\u5165 1\u20132000 \u5B57\u7684\u5BA0\u7269\u63CF\u8FF0");
  const id = await sessions.create({ cwd: directory });
  const text = `\u8BF7\u5148\u8BFB\u53D6\u5E76\u9075\u5FAA\u5BA0\u7269\u521B\u5EFA Skill\uFF1A${skill}
\u5BA0\u7269\u8981\u6C42\uFF1A${description.trim()}
\u6210\u54C1\u4FDD\u5B58\u5230 ${directory} \u4E0B\u7684\u65B0\u76EE\u5F55\uFF0C\u4FDD\u7559\u6240\u6709\u5DF2\u6709\u5BA0\u7269\u3002\u4F7F\u7528 DSH \u5F53\u524D\u914D\u7F6E\u7684\u56FE\u50CF\u5DE5\u5177\u3002\u7F3A\u5C11\u751F\u56FE\u5DE5\u5177\u65F6\u660E\u786E\u8BF4\u660E\uFF0C\u4E0D\u751F\u6210\u5360\u4F4D\u56FE\uFF0C\u4E0D\u865A\u62A5\u5B8C\u6210\u3002`;
  const send = async (session) => {
    const result = await session.prompt([{ type: "text", text }], "queue");
    if (!result.ok) throw new Error(result.error?.message ?? "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42");
  };
  tryOpen(sessions, id);
  const binding = sessions.binding(id, "creation");
  if (binding?.session.prompt) {
    await send(binding.session);
    tryOpen(sessions, id);
    return;
  }
  if (sessions.using) {
    await sessions.using(id, { source: "controllerOperation" }, async (reference) => {
      await reference.ready;
      await send(reference.binding.session);
    });
    tryOpen(sessions, id);
    return;
  }
  throw new Error("\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5");
}

// src/settings-icon.ts
var import_react6 = __toESM(require("react"), 1);
var PAW = '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>';
function PetNavIcon({ size = 16 }) {
  return import_react6.default.createElement(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    import_react6.default.createElement("circle", { cx: 11, cy: 4, r: 2 }),
    import_react6.default.createElement("circle", { cx: 18, cy: 8, r: 2 }),
    import_react6.default.createElement("circle", { cx: 20, cy: 16, r: 2 }),
    import_react6.default.createElement("path", {
      d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"
    })
  );
}
var PAW_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PAW}</svg>`
)}")`;
var PET_NAV_ICON_MARKER = "data-dcp-nav-icon";
var PET_NAV_ROW_SELECTOR = '[role="dialog"] nav button, .dcu-settings-link';
var NAV_ICON_STYLE_ID = "dcp-settings-nav-icon-style";
var NAV_ICON_CSS = [
  `[${PET_NAV_ICON_MARKER}] > svg { display: none !important; }`,
  `[${PET_NAV_ICON_MARKER}]::before {`,
  `  content: '';`,
  `  flex: none;`,
  `  width: 16px;`,
  `  height: 16px;`,
  `  color: var(--dcu-sidebar-icon, currentColor);`,
  `  background: currentColor;`,
  `  -webkit-mask: ${PAW_MASK} center / contain no-repeat;`,
  `  mask: ${PAW_MASK} center / contain no-repeat;`,
  `  -webkit-mask-repeat: no-repeat;`,
  `  mask-repeat: no-repeat;`,
  `  -webkit-mask-position: center;`,
  `  mask-position: center;`,
  `  -webkit-mask-size: 16px 16px;`,
  `  mask-size: 16px 16px;`,
  `}`
].join("\n");
function ensureNavIconStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(NAV_ICON_STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = NAV_ICON_STYLE_ID;
  style.textContent = NAV_ICON_CSS;
  (document.head ?? document.documentElement).appendChild(style);
}
var PET_LABELS = /* @__PURE__ */ new Set([
  "\u5BA0\u7269",
  "Pets",
  "\u30DA\u30C3\u30C8",
  "Mascotas",
  "Animaux",
  "Haustiere",
  "\u041F\u0438\u0442\u043E\u043C\u0446\u044B",
  "Mascotes"
]);
function isPetNavRow(button) {
  const label = button.textContent?.trim() ?? "";
  return PET_LABELS.has(label);
}
function applyPetSettingsIcon(button) {
  const isOwn = isPetNavRow(button);
  if (isOwn) {
    const hasSlotIcon = Array.from(button.children).some(
      (child) => child.tagName === "SPAN" && child.className && String(child.className).includes("navIcon")
    ) || Boolean(button.querySelector?.('span[class*="navIcon"]'));
    if (hasSlotIcon) {
      if (button.hasAttribute(PET_NAV_ICON_MARKER)) {
        button.removeAttribute(PET_NAV_ICON_MARKER);
        return true;
      }
      return false;
    }
    if (button.getAttribute(PET_NAV_ICON_MARKER) === "") return false;
    button.setAttribute(PET_NAV_ICON_MARKER, "");
    return true;
  }
  if (button.hasAttribute(PET_NAV_ICON_MARKER)) {
    button.removeAttribute(PET_NAV_ICON_MARKER);
    return true;
  }
  return false;
}
function restorePetSettingsIcon(button) {
  if (!button.hasAttribute(PET_NAV_ICON_MARKER)) return false;
  button.removeAttribute(PET_NAV_ICON_MARKER);
  return true;
}
function observePetSettingsIcon() {
  if (typeof document === "undefined" || document.body === null)
    return () => {
    };
  ensureNavIconStyle();
  let disposed = false;
  let frame;
  let timer;
  let lastRun = Number.NEGATIVE_INFINITY;
  const markedRows = /* @__PURE__ */ new Set();
  const hasSettingsSurface = () => document.querySelector(
    '.dcu-settings-page, .dcu-settings-link, [data-shortcut-modal="settings"]'
  ) !== null;
  let surfaceOpen = false;
  const sync = () => {
    frame = void 0;
    if (disposed) return;
    lastRun = performance.now();
    surfaceOpen = hasSettingsSurface();
    if (!surfaceOpen && markedRows.size === 0) return;
    for (const row of document.querySelectorAll(PET_NAV_ROW_SELECTOR)) {
      applyPetSettingsIcon(row);
      if (row.hasAttribute(PET_NAV_ICON_MARKER)) markedRows.add(row);
      else markedRows.delete(row);
    }
    for (const row of markedRows) if (!row.isConnected) markedRows.delete(row);
  };
  const MIN_INTERVAL = 150;
  const schedule = () => {
    if (disposed) return;
    const open = hasSettingsSurface();
    if (open && !surfaceOpen) {
      if (timer !== void 0) {
        window.clearTimeout(timer);
        timer = void 0;
      }
      if (frame !== void 0) {
        window.cancelAnimationFrame(frame);
        frame = void 0;
      }
      sync();
      return;
    }
    if (!open) surfaceOpen = false;
    if (frame !== void 0 || timer !== void 0) return;
    const wait = MIN_INTERVAL - (performance.now() - lastRun);
    if (wait > 0) {
      timer = window.setTimeout(() => {
        timer = void 0;
        schedule();
      }, wait);
      return;
    }
    frame = window.requestAnimationFrame(sync);
  };
  sync();
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
  return () => {
    disposed = true;
    observer.disconnect();
    if (frame !== void 0) window.cancelAnimationFrame(frame);
    if (timer !== void 0) window.clearTimeout(timer);
    for (const row of document.querySelectorAll(`[${PET_NAV_ICON_MARKER}]`)) {
      restorePetSettingsIcon(row);
    }
    document.getElementById(NAV_ICON_STYLE_ID)?.remove();
  };
}

// src/global-overlay.tsx
var import_react7 = require("react");
var import_react_dom = require("react-dom");
function GlobalOverlay({ children }) {
  const [container, setContainer] = (0, import_react7.useState)(null);
  (0, import_react7.useEffect)(() => {
    const element = document.createElement("div");
    element.setAttribute("data-dsh-pet-overlay", "");
    element.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483000;pointer-events:none";
    document.body.append(element);
    setContainer(element);
    return () => element.remove();
  }, []);
  return container ? (0, import_react_dom.createPortal)(children, container) : null;
}

// src/client.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var name = "michengai-codex-pet";
var inject = ["slots", "sessions", "locale"];
var EMPTY_NOTIFICATIONS = {
  items: [],
  activity: IDLE,
  hidden: 0
};
function openSettings() {
  const trigger = document.querySelector("[data-dcu-settings-trigger]");
  if (trigger)
    trigger.dispatchEvent(
      new CustomEvent("dcu-settings-open-section", {
        bubbles: true,
        cancelable: true,
        detail: {
          labels: [
            "\u5BA0\u7269",
            "Pets",
            "\u30DA\u30C3\u30C8",
            "Mascotas",
            "Animaux",
            "Haustiere",
            "\u041F\u0438\u0442\u043E\u043C\u0446\u044B",
            "Mascotes"
          ]
        }
      })
    );
  else window.dispatchEvent(new Event("dcp-open-settings"));
}
function Overlay({
  sessions,
  pending,
  locale
}) {
  const controller = usePetController(locale);
  const t = translator(controller.language);
  const [settingsOpen, setSettingsOpen] = (0, import_react8.useState)(false);
  (0, import_react8.useEffect)(() => {
    const show = () => setSettingsOpen(true);
    window.addEventListener("dcp-open-settings", show);
    return () => window.removeEventListener("dcp-open-settings", show);
  }, []);
  const [state, setState] = (0, import_react8.useState)(EMPTY_NOTIFICATIONS);
  const notifications = (0, import_react8.useRef)(
    null
  );
  const dismissed = (0, import_react8.useRef)(/* @__PURE__ */ new Map());
  const createDraft = (0, import_react8.useRef)("");
  const petVisible = controller.library?.config.visible === true;
  (0, import_react8.useEffect)(() => {
    if (!petVisible) {
      setState(
        (current) => current.items.length === 0 && current.activity.pose === "idle" && current.hidden === 0 ? current : EMPTY_NOTIFICATIONS
      );
      return;
    }
    const engine = createNotifications(
      sessions,
      pending,
      setState,
      Date.now,
      dismissed.current
    );
    notifications.current = engine;
    return () => {
      notifications.current = null;
      engine.dispose();
      sessions.releaseBindings();
    };
  }, [sessions, pending, petVisible]);
  (0, import_react8.useEffect)(observePetSettingsIcon, []);
  const command = async (value) => {
    const engine = notifications.current;
    if (!engine) throw new Error("\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA");
    if (value.type === "sort") {
      engine.sort(value.latest);
      return;
    }
    await engine.command(value);
  };
  const [externalDisplay, setExternalDisplay] = (0, import_react8.useState)(false);
  const actions = (0, import_react8.useRef)({
    command,
    updateConfig: controller.update,
    openSettings
  });
  actions.current = { command, updateConfig: controller.update, openSettings };
  const provider = (0, import_react8.useRef)(
    null
  );
  (0, import_react8.useEffect)(() => {
    const value = createCompanionProvider({
      command: (command2) => actions.current.command(command2),
      updateConfig: (config) => actions.current.updateConfig(config),
      openSettings: () => actions.current.openSettings(),
      externalDisplay: setExternalDisplay
    });
    provider.current = value;
    window.dshPet = value.api;
    window.dispatchEvent(new Event("dsh-pet-ready"));
    return () => {
      value.dispose();
      provider.current = null;
      if (window.dshPet === value.api) delete window.dshPet;
      window.dispatchEvent(new Event("dsh-pet-disposed"));
    };
  }, []);
  (0, import_react8.useEffect)(() => {
    const library = controller.library;
    provider.current?.publish(
      library ? {
        pet: library.pets.find((pet) => pet.id === library.config.selected) ?? null,
        config: library.config,
        language: controller.language,
        notifications: state
      } : null
    );
  }, [controller.library, controller.language, state]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    !externalDisplay && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      Companion,
      {
        controller,
        activity: state.activity,
        tray: { state, command },
        open: () => {
          if (state.activity.sessionId) sessions.open?.(state.activity.sessionId);
        },
        settings: openSettings
      }
    ),
    settingsOpen && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      import_dsh_client_ui_primitives2.Modal,
      {
        open: true,
        headless: true,
        className: "dcp dcp-settings-modal",
        title: t("\u5BA0\u7269\u8BBE\u7F6E"),
        onClose: () => setSettingsOpen(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dcp-settings-modal-body", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_dsh_client_ui_primitives2.Button,
            {
              type: "button",
              variant: "ghost",
              size: "sm",
              className: "dcp-dialog-close",
              onClick: () => setSettingsOpen(false),
              children: t("\u5173\u95ED\u8BBE\u7F6E")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            Settings,
            {
              draft: createDraft,
              controller,
              locale,
              create: async (description) => {
                const library = controller.library;
                if (!library) throw new Error("\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D");
                await createPetSession(
                  sessions,
                  description,
                  library.customPath,
                  library.skillPath
                );
              }
            }
          )
        ] })
      }
    )
  ] });
}
function Page({
  sessions,
  locale
}) {
  const controller = usePetController(locale);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    Settings,
    {
      controller,
      locale,
      create: async (description) => {
        const library = controller.library;
        if (!library) throw new Error("\u5BA0\u7269\u5E93\u5C1A\u672A\u52A0\u8F7D");
        await createPetSession(
          sessions,
          description,
          library.customPath,
          library.skillPath
        );
      }
    }
  );
}
function probe(ctx, name2) {
  if (ctx.reflect) {
    try {
      return ctx.reflect.get(name2);
    } catch {
      return void 0;
    }
  }
  return ctx[name2];
}
function liveSessionStatus(ctx) {
  const resolve = () => {
    const live = probe(ctx, "uiSession");
    return live?.sessionStatus;
  };
  return {
    getSnapshot() {
      return resolve()?.getSnapshot() ?? /* @__PURE__ */ new Map();
    },
    subscribe(listener) {
      let source = resolve();
      let off = source?.subscribe(listener);
      const timer = setInterval(() => {
        const next = resolve();
        if (next === source) return;
        off?.();
        source = next;
        off = next?.subscribe(listener);
        listener();
      }, 250);
      return () => {
        clearInterval(timer);
        off?.();
      };
    }
  };
}
function apply(ctx) {
  const status = liveSessionStatus(ctx);
  const sessions = compatibleSessions(
    ctx.sessions,
    (id) => {
      const uiWorkspace = probe(ctx, "uiWorkspace");
      if (uiWorkspace) return uiWorkspace.openSession(id);
    },
    status
  );
  const pending = pendingFromSessionStatus(status);
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "codex-pet",
        label: () => translator(ctx.locale.getSnapshot().active)("\u5BA0\u7269"),
        order: 50
      },
      () => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Page, { sessions, locale: ctx.locale })
    )
  );
  ctx.slots.inject(
    "settings.section.icon",
    () => ctx.slots.register(
      {
        name: "settings.section.icon",
        id: "codex-pet"
      },
      PetNavIcon
    )
  );
  ctx.slots.inject(
    "shell.overlay",
    () => ctx.slots.register(
      { name: "shell.overlay", id: "michengai-codex-pet", order: 100 },
      () => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(GlobalOverlay, { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Overlay,
        {
          sessions,
          pending,
          locale: ctx.locale
        }
      ) })
    )
  );
}

return module.exports;}});
