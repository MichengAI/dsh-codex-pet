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
function compatibleSessions(sessions, navigate, status) {
  const cache = /* @__PURE__ */ new WeakMap();
  const refs = /* @__PURE__ */ new Map();
  const sweep = () => {
    const ids = new Set(sessions.list?.getSnapshot?.()?.ids ?? []);
    for (const [id, ref] of refs) if (!ids.has(id)) {
      try {
        ref.release();
      } catch {
      }
      refs.delete(id);
    }
  };
  sessions.list?.subscribe?.(sweep);
  return {
    list: sessions.list,
    status: status ?? sessions.status,
    using: sessions.using?.bind(sessions),
    open: (id) => navigate ? navigate(id) : sessions.open?.(id),
    create: (options) => {
      if (!sessions.create) throw new Error("\u521B\u5EFA\u4F1A\u8BDD\u5C1A\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u8BD5");
      return sessions.create(options);
    },
    binding(id) {
      sweep();
      let binding = sessions.binding(id);
      if (!binding && sessions.retain) {
        let ref = refs.get(id);
        if (!ref) {
          try {
            ref = sessions.retain(id, { source: "controllerOperation" });
            refs.set(id, ref);
          } catch {
            return void 0;
          }
        }
        binding = ref.binding;
      }
      if (!binding || binding.eventSource) return binding;
      const cached = cache.get(binding);
      if (cached) return cached;
      let lastSeq = -1, initialized = false;
      let snapshot = { revision: 0, change: { kind: "replace", entries: [] } };
      const eventSource = {
        getSnapshot() {
          const state = binding.session.getSnapshot();
          if (state.openState === "cold" || state.openState === "loading") initialized = false;
          const events = [...state.chat?.timeline.turns.values() ?? []].flatMap((turn) => [turn.start, turn.end]).filter((entry) => !!entry).sort((a, b) => a.seq - b.seq);
          const additions = events.filter((entry) => entry.seq > lastSeq);
          if (additions.length) {
            lastSeq = additions.at(-1).seq;
            snapshot = { revision: snapshot.revision + 1, change: { kind: initialized ? "append" : "replace", entries: additions.map((entry) => ({ type: "event", event: entry })) } };
          }
          initialized = state.openState === void 0 || state.openState === "open";
          return snapshot;
        },
        subscribe: (listener) => binding.session.subscribe(listener)
      };
      const adapted = { ...binding, eventSource };
      cache.set(binding, adapted);
      return adapted;
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

// src/legacy-pending.ts
function compatiblePending(sessions, resolveModern) {
  const legacy = legacyPending(sessions);
  const listeners = /* @__PURE__ */ new Set();
  let source = legacy;
  let off;
  let timer;
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const sync = () => {
    const next = resolveModern() ?? legacy;
    if (next === source && off) return;
    off?.();
    source = next;
    off = listeners.size ? source.subscribe(notify) : void 0;
    notify();
  };
  return {
    getSnapshot: () => source.getSnapshot(),
    subscribe(listener) {
      listeners.add(listener);
      if (!timer) {
        sync();
        timer = setInterval(sync, 250);
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          clearInterval(timer);
          timer = void 0;
          off?.();
          off = void 0;
        }
      };
    }
  };
}
function legacyPending(sessions) {
  const listeners = /* @__PURE__ */ new Set();
  const subscriptions = /* @__PURE__ */ new Map();
  let snapshot = /* @__PURE__ */ new Map();
  let offList;
  const refresh = () => {
    const list = sessions.list.getSnapshot();
    for (const [id, item] of subscriptions) if (!list.byId[id] || list.byId[id].origin === "subagent") {
      item.off();
      subscriptions.delete(id);
    }
    const next = /* @__PURE__ */ new Map();
    for (const id of list.ids) {
      if (list.byId[id]?.origin === "subagent") continue;
      const source = sessions.binding(id)?.session;
      if (!source) continue;
      if (listeners.size && subscriptions.get(id)?.source !== source) {
        subscriptions.get(id)?.off();
        subscriptions.set(id, { source, off: source.subscribe(refresh) });
      }
      const wait = source.getSnapshot().pending?.[0];
      if (!wait) continue;
      next.set(id, {
        kind: wait.kind,
        key: wait.key,
        sessionId: wait.sessionId,
        ...wait.payload,
        async answer(answer) {
          if (wait.sessionId !== id || !source.getSnapshot().pending?.includes(wait)) throw new Error("\u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u5DF2\u66F4\u6362");
          const normalized = wait.kind === "question" ? { answers: answer.answers.map(({ custom, ...item }) => ({ ...item, ...custom?.trim() ? { custom: custom.trim() } : {} })) } : answer;
          const value = wait.kind === "approval" ? { sessionId: id, approvalId: wait.payload.approvalId, outcome: answer } : { sessionId: id, answer: normalized };
          const receipt = await wait.respond({ ok: true, value });
          if (!receipt.accepted) throw new Error(receipt.reason ?? "\u5BBF\u4E3B\u62D2\u7EDD\u54CD\u5E94");
        }
      });
    }
    snapshot = next;
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      if (!offList) {
        offList = sessions.list.subscribe(refresh);
        refresh();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          offList?.();
          offList = void 0;
          for (const item of subscriptions.values()) item.off();
          subscriptions.clear();
        }
      };
    }
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

// src/ui-locales.ts
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
  "DSH \u672A\u63A5\u53D7\u5BA0\u7269\u521B\u5EFA\u8BF7\u6C42": "DSH did not accept the pet creation request"
};
function translator(language) {
  return (message, values = {}) => {
    const text = /^zh(?:-|$)/i.test(language) ? message : en[message] ?? message;
    return text.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
  };
}

// src/client.tsx
var import_react7 = require("react");

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
function GithubMark16() {
  return import_react.default.createElement(
    "svg",
    { viewBox: "0 0 16 16", width: 16, height: 16, "aria-hidden": true, focusable: false },
    import_react.default.createElement("path", { fill: "currentColor", d: "M8 0a8 8 0 0 0-2.53 15.59c.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.484-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.726-.496.055-.486.055-.486.803.056 1.225.824 1.225.824.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.202-3.645-.888-3.645-3.956 0-.874.31-1.588.823-2.148-.083-.202-.357-1.017.078-2.12 0 0 .672-.215 2.2.82A7.65 7.65 0 0 1 8 4.8c.68.003 1.365.092 2.004.27 1.527-1.035 2.197-.82 2.197-.82.437 1.103.162 1.918.08 2.12.513.56.822 1.274.822 2.148 0 3.076-1.872 3.752-3.654 3.95.288.248.544.735.544 1.482 0 1.07-.01 1.932-.01 2.195 0 .214.144.463.55.384A8.001 8.001 0 0 0 8 0Z" })
  );
}
function FeedbackMark16() {
  return import_react.default.createElement(
    "svg",
    { viewBox: "0 0 16 16", width: 16, height: 16, fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true, focusable: false },
    import_react.default.createElement("path", { d: "M10.8239 3.54733V4.78443H4.63437V3.54733H10.8239Z", fill: "currentColor" }),
    import_react.default.createElement("path", { d: "M10.8239 6.12629V7.36338H4.63437V6.12629H10.8239Z", fill: "currentColor" }),
    import_react.default.createElement("path", { d: "M9.073 8.70524V9.94234H4.63437V8.70524H9.073Z", fill: "currentColor" }),
    import_react.default.createElement("path", { d: "M9.13321 0.573526C10.0076 0.573525 10.7179 0.572522 11.285 0.63397C11.8645 0.696791 12.3743 0.831648 12.8193 1.1548C13.0776 1.34246 13.3056 1.57047 13.4933 1.82875C13.8164 2.2737 13.9513 2.7836 14.0141 3.36303C14.0755 3.93015 14.0745 4.64049 14.0745 5.51485V6.1757L12.7327 7.5629V5.51485C12.7327 4.61092 12.732 3.9862 12.6803 3.5081C12.6298 3.0427 12.5379 2.79497 12.4083 2.61654C12.3033 2.47211 12.176 2.34472 12.0315 2.23977C11.8531 2.11016 11.6054 2.01823 11.14 1.96777C10.6618 1.91601 10.0372 1.91539 9.13321 1.91539H6.32658C5.42262 1.91539 4.79796 1.91604 4.31983 1.96777C3.85451 2.01819 3.60672 2.11029 3.42827 2.23977C3.28392 2.34465 3.15643 2.47223 3.0515 2.61654C2.9219 2.79496 2.82997 3.04274 2.7795 3.5081C2.72774 3.9862 2.72712 4.61092 2.72712 5.51485V10.023C2.72712 10.9273 2.72773 11.5525 2.7795 12.0307C2.82992 12.4959 2.92205 12.7429 3.0515 12.9213C3.15645 13.0657 3.28384 13.1931 3.42827 13.2981C3.60676 13.4277 3.85408 13.5206 4.31983 13.5711C4.79797 13.6228 5.42259 13.6234 6.32658 13.6234H6.87057L5.57707 14.9593C5.03527 14.9556 4.57031 14.9467 4.17476 14.9039C3.59508 14.841 3.08558 14.7063 2.64048 14.383C2.38215 14.1953 2.15422 13.9684 1.96653 13.7101C1.64319 13.2649 1.50851 12.7546 1.4457 12.1748C1.38432 11.6076 1.38525 10.8974 1.38525 10.023V5.51485C1.38525 4.64049 1.38426 3.93015 1.4457 3.36303C1.50853 2.78363 1.64341 2.27368 1.96653 1.82875C2.15417 1.57059 2.38228 1.34239 2.64048 1.1548C3.08544 0.831805 3.59533 0.696762 4.17476 0.63397C4.74193 0.572552 5.45218 0.573525 6.32658 0.573526H9.13321Z", fill: "currentColor" }),
    import_react.default.createElement("path", { d: "M14.2193 14.9553H10.0124L11.3744 13.6134H14.2193V14.9553Z", fill: "currentColor" }),
    import_react.default.createElement("path", { d: "M8.24493 13.3711L7.49015 14.8806C7.40148 15.058 7.58961 15.2461 7.76695 15.1574L9.27651 14.4027L14.6147 9.09934L13.5832 8.06775L8.24493 13.3711Z", fill: "currentColor" })
  );
}

// src/update-errors.ts
var messages = {
  "INVALID_VERSION": [
    "\u65E0\u6CD5\u8BFB\u53D6\u5F53\u524D\u63D2\u4EF6\u7248\u672C\u3002",
    "Could not read the current plugin version."
  ],
  "AUTO_UPDATE_UNAVAILABLE": [
    "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u81EA\u52A8\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u624B\u5DE5\u66F4\u65B0\u547D\u4EE4\u3002",
    "Automatic updates are unavailable. Use the manual update command."
  ],
  "UPDATE_TIMEOUT": [
    "\u66F4\u65B0\u8D85\u65F6\uFF0C\u5DF2\u8BF7\u6C42\u53D6\u6D88\uFF1B\u8FDB\u7A0B\u7ED3\u675F\u524D\u4E0D\u80FD\u518D\u6B21\u5B89\u88C5\u3002",
    "The update timed out and cancellation was requested. Wait for the process to exit before retrying."
  ],
  "UNTRUSTED_REQUEST": [
    "\u5DF2\u62D2\u7EDD\u975E\u672C\u673A\u540C\u6E90\u66F4\u65B0\u8BF7\u6C42\u3002",
    "The update request was rejected because it is not from the same local origin."
  ],
  "UPDATE_IN_PROGRESS": [
    "\u5F53\u524D\u63D2\u4EF6\u6B63\u5728\u66F4\u65B0\uFF0C\u8BF7\u7A0D\u5019\u3002",
    "The plugin is being updated. Please wait."
  ],
  "NOT_PUBLISHED": [
    "\u63D2\u4EF6\u5C1A\u672A\u53D1\u5E03\u5230 npm\u3002",
    "The plugin has not been published to npm yet."
  ],
  "REGISTRY_UNAVAILABLE": [
    "\u6682\u65F6\u65E0\u6CD5\u83B7\u53D6\u6700\u65B0\u7248\u672C\u3002",
    "Could not retrieve the latest version. Please try again later."
  ],
  "UPDATE_FAILED": [
    "\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u670D\u52A1\u7AEF\u65E5\u5FD7\u3002",
    "The update failed. Check the server logs."
  ]
};
function updateErrorMessage(code, language) {
  const key = typeof code === "string" && Object.hasOwn(messages, code) ? code : "UPDATE_FAILED";
  return messages[key][/^zh(?:-|$)/i.test(language) ? 0 : 1];
}

// src/shared-plugin-update-ui.ts
var UPDATE_HEADER = "x-michengai-plugin-update";
var STYLE_ID = "michengai-plugin-update-ui";
var CSS = `
.mpi-version{margin-left:8px;color:var(--dsw-alias-label-tertiary,#9da1aa);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;letter-spacing:0;white-space:nowrap;vertical-align:baseline}.mpi-check{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);font:inherit;font-size:12px;font-weight:500;line-height:18px;white-space:nowrap;cursor:pointer}.mpi-check:hover{background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}.mpi-check:focus-visible,.mpi-dialog .mpi-action:focus-visible,.mpi-dialog .mpi-dialog-close:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f8cff);outline-offset:2px}.mpi-icon{display:inline-flex;flex:0 0 auto;width:16px;height:16px;align-items:center;justify-content:center;pointer-events:none}.mpi-icon svg{display:block;width:16px;height:16px}
.mpi-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.62)}.mpi-dialog{position:relative;box-sizing:border-box;width:min(680px,100%);max-height:calc(100vh - 48px);overflow:auto;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:14px;padding:22px;background:var(--dsw-alias-bg-layer-2,var(--dsw-specific-menu,#202124));color:var(--dsw-alias-label-primary,#fff);box-shadow:var(--dsw-shadow-lv3,0 16px 48px rgba(0,0,0,.24));font-family:inherit}.mpi-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.mpi-dialog h2{margin:0;font-size:18px;line-height:26px}.mpi-dialog .mpi-dialog-close{display:inline-flex;flex:0 0 28px;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);cursor:pointer}.mpi-dialog .mpi-dialog-close:hover{background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}.mpi-intro{margin:8px 0 18px;color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:13px;line-height:20px}.mpi-meta{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 18px;margin:0 0 16px;font-size:12px;line-height:18px}.mpi-meta dt{color:var(--dsw-alias-label-secondary,#c2c4ca)}.mpi-meta dd{margin:0;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.mpi-status{margin:0 0 18px;border-radius:7px;padding:12px 14px;background:var(--dsw-alias-bg-layer-3,var(--dsw-specific-menu-item-hover,#252527));font-size:13px;font-weight:600;line-height:20px}.mpi-status[data-kind=error]{color:var(--dsw-alias-state-error-primary,#ff6464)}.mpi-status[data-kind=success]{color:var(--dsw-alias-state-success-primary,#36d67a)}.mpi-status[data-kind=update]{color:#e8b15a !important}.mpi-manual{border-top:1px solid var(--dsw-alias-border-l2,#4b4d52);padding-top:16px}.mpi-manual h3{margin:0 0 6px;font-size:14px;line-height:20px}.mpi-manual p{margin:0 0 10px;color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:12px;line-height:18px}.mpi-command{display:flex;align-items:center;gap:8px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;padding:10px;background:var(--dsw-alias-bg-layer-3,var(--dsw-specific-menu-item-hover,#252527))}.mpi-command code{min-width:0;flex:1;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:18px;white-space:nowrap}.mpi-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:18px}.mpi-actions-group{display:flex;gap:8px}.mpi-dialog .mpi-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:32px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:7px;padding:6px 10px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}.mpi-dialog .mpi-action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#414247)}.mpi-dialog .mpi-action:disabled{cursor:not-allowed;opacity:.55}.mpi-dialog .mpi-primary{border-color:var(--dsw-alias-state-business-primary,#4f8cff);background:var(--dsw-alias-state-business-primary,#4f8cff);color:#fff}.mpi-progress{height:4px;margin-top:10px;overflow:hidden;border-radius:99px;background:var(--dsw-alias-border-l2,#4b4d52)}.mpi-progress::after{display:block;width:32%;height:100%;background:var(--dsw-alias-state-business-primary,#4f8cff);content:'';animation:mpi-wave 1.15s ease-in-out infinite}@keyframes mpi-wave{from{transform:translateX(-110%)}to{transform:translateX(330%)}}@media(max-width:560px){.mpi-overlay{padding:10px}.mpi-dialog{max-height:calc(100vh - 20px);padding:16px}.mpi-actions{align-items:stretch}.mpi-actions-group{justify-content:flex-end;flex-wrap:wrap}.mpi-meta{grid-template-columns:1fr;gap:2px}.mpi-meta dd{margin-bottom:6px}}
`;
var ZH = {
  unpublished: "\u5C1A\u672A\u53D1\u5E03\u5230 npm\uFF0C\u53D1\u5E03\u540E\u5373\u53EF\u68C0\u67E5\u5E76\u5B89\u88C5\u66F4\u65B0\u3002",
  check: "\u68C0\u67E5\u66F4\u65B0",
  update: "\u66F4\u65B0",
  close: "\u5173\u95ED",
  recheck: "\u91CD\u65B0\u68C0\u67E5",
  auto: "\u81EA\u52A8\u66F4\u65B0",
  updating: "\u6B63\u5728\u66F4\u65B0\u2026",
  copy: "\u590D\u5236\u547D\u4EE4",
  copied: "\u5DF2\u590D\u5236",
  copyFailed: "\u590D\u5236\u5931\u8D25",
  checking: "\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u2026",
  latest: "\u5DF2\u662F\u6700\u65B0\u7248\u672C",
  found: "\u53D1\u73B0\u65B0\u7248\u672C",
  failed: "\u68C0\u67E5\u66F4\u65B0\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
  current: "\u8FD0\u884C\u7248\u672C",
  latestLabel: "\u6700\u65B0\u7248\u672C",
  profile: "\u76EE\u6807 profile",
  unknown: "\u672A\u77E5",
  manual: "\u624B\u5DE5\u66F4\u65B0",
  manualHint: "\u81EA\u52A8\u66F4\u65B0\u5931\u8D25\u65F6\uFF0C\u53EF\u5728\u5F53\u524D DSH \u7EC8\u7AEF\u6267\u884C\u4EE5\u4E0B\u547D\u4EE4\uFF0C\u5B8C\u6210\u540E\u91CD\u542F DSH Web\u3002",
  manualHintDesktop: "\u81EA\u52A8\u66F4\u65B0\u5931\u8D25\u65F6\uFF0C\u8BF7\u5148\u5B8C\u5168\u9000\u51FA DSH Desktop\uFF0C\u518D\u7528 Desktop \u81EA\u5E26\u7684 dsh \u6267\u884C\u4EE5\u4E0B\u547D\u4EE4\u3002\u666E\u901A dsh \u4F1A\u62D2\u7EDD desktop profile\u3002",
  intro: "\u4EC5\u68C0\u67E5\u5E76\u66F4\u65B0\u5F53\u524D\u63D2\u4EF6\uFF0C\u4E0D\u4F1A\u8054\u52A8\u5B89\u88C5\u5176\u4ED6\u63D2\u4EF6\u3002",
  restart: "\u66F4\u65B0\u5B8C\u6210\uFF0C\u8BF7\u91CD\u542F DSH Web\u3002",
  restartDesktop: "\u66F4\u65B0\u5B8C\u6210\uFF0C\u8BF7\u5B8C\u5168\u9000\u51FA\u5E76\u91CD\u65B0\u6253\u5F00 DSH Desktop\u3002",
  restarting: "\u66F4\u65B0\u5B8C\u6210\uFF0C\u6B63\u5728\u91CD\u65B0\u52A0\u8F7D DSH\u2026",
  unavailable: "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u81EA\u52A8\u66F4\u65B0\uFF0C\u8BF7\u4F7F\u7528\u624B\u5DE5\u66F4\u65B0\u547D\u4EE4\u3002"
};
var EN = {
  unpublished: "Not published to npm yet. Updates will be available after publication.",
  check: "Check for updates",
  update: "Update",
  close: "Close",
  recheck: "Check again",
  auto: "Update automatically",
  updating: "Updating\u2026",
  copy: "Copy command",
  copied: "Copied",
  copyFailed: "Copy failed",
  checking: "Checking for updates\u2026",
  latest: "You are up to date",
  found: "New version available",
  failed: "Could not check for updates. Try again later.",
  current: "Running version",
  latestLabel: "Latest version",
  profile: "Target profile",
  unknown: "Unknown",
  manual: "Manual update",
  manualHint: "If automatic update fails, run this command in the current DSH terminal, then restart DSH Web.",
  manualHintDesktop: "If automatic update fails, fully quit DSH Desktop, then run this command with Desktop's own dsh. A regular dsh rejects the desktop profile.",
  intro: "Only this plugin is checked and updated. Other plugins are not changed.",
  restart: "Update complete. Restart DSH Web.",
  restartDesktop: "Update complete. Fully quit and reopen DSH Desktop.",
  restarting: "Update complete. Reloading DSH\u2026",
  unavailable: "Automatic update is unavailable. Use the manual command."
};
function strings(language) {
  return /^zh(?:-|$)/i.test(language) ? ZH : EN;
}
function ensureStyle() {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head ?? document.documentElement).append(style);
}
function validPayload(value) {
  if (value === null || typeof value !== "object") return false;
  const item = value;
  return typeof item.packageName === "string" && typeof item.currentVersion === "string" && typeof item.updateAvailable === "boolean" && typeof item.profileName === "string" && typeof item.canAutoUpdate === "boolean" && typeof item.latestCheckFailed === "boolean" && (item.latestVersion === void 0 || typeof item.latestVersion === "string");
}
async function requestStatus(endpoint, method, signal, language = "zh") {
  const signalOption = signal === void 0 ? {} : { signal };
  const response = await fetch(
    endpoint,
    method === "GET" ? { cache: "no-store", ...signalOption } : {
      method: "POST",
      headers: { "content-type": "application/json", [UPDATE_HEADER]: "1" },
      body: "{}",
      ...signalOption
    }
  );
  const value = await response.json();
  if (!response.ok || !validPayload(value))
    throw new Error(updateErrorMessage(value.code, language));
  return value;
}
function manualPluginUpdateCommand(profileName, packageName, version) {
  const profile = profileName.trim() === "" ? "" : ` --profile ${profileName.trim()}`;
  return `dsh plugin${profile} add ${packageName}@${version} --registry=https://registry.npmjs.org/`;
}
function handlePluginUpdateEscape(event, close) {
  if (event.key !== "Escape") return false;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  close();
  return true;
}
function observePluginUpdate(options) {
  if (typeof document === "undefined" || document.body === null)
    return () => {
    };
  ensureStyle();
  const controller = new AbortController();
  let payload;
  let overlay;
  let frame;
  const setButtonContent = (button, label, iconName) => {
    const icon = options.createIcon(iconName);
    icon.classList.add("mpi-icon");
    icon.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.dataset.mpiLabel = "";
    text.textContent = label;
    button.replaceChildren(icon, text);
  };
  const setButtonLabel = (button, label) => {
    const text = button.querySelector("[data-mpi-label]");
    if (text === null) button.textContent = label;
    else text.textContent = label;
  };
  const applyControls = () => {
    const row = options.root ?? document.querySelector(options.titleRowSelector);
    if (row === null) return;
    const links = row.querySelector(options.linksSelector);
    if (links === null || links.querySelector(`[data-mpi-check="${options.packageName}"]`) !== null)
      return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mpi-check";
    button.dataset.mpiCheck = options.packageName;
    setButtonContent(button, strings(options.language).check, "refresh");
    button.addEventListener("click", openDialog);
    links.append(button);
  };
  const load = async () => {
    payload = await requestStatus(
      options.endpoint,
      "GET",
      controller.signal,
      options.language
    );
    applyControls();
    return payload;
  };
  const closeDialog = () => {
    overlay?.remove();
    overlay = void 0;
  };
  function openDialog() {
    closeDialog();
    const text = strings(options.language);
    overlay = document.createElement("div");
    overlay.className = "mpi-overlay";
    const dialog = document.createElement("section");
    dialog.className = "mpi-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.innerHTML = `<header class="mpi-head"><h2></h2><button type="button" class="mpi-dialog-close" data-action="close"></button></header><p class="mpi-intro"></p><dl class="mpi-meta"><dt></dt><dd data-role="current"></dd><dt></dt><dd data-role="latest"></dd><dt></dt><dd data-role="profile"></dd></dl><div class="mpi-status" role="status"></div><div class="mpi-progress" hidden></div><section class="mpi-manual"><h3></h3><p></p><div class="mpi-command"><code></code><button type="button" class="mpi-action" data-action="copy"></button></div></section><footer class="mpi-actions"><div class="mpi-actions-group"><button type="button" class="mpi-action" data-action="check"></button><button type="button" class="mpi-action mpi-primary" data-action="update"></button></div></footer>`;
    const name2 = /^zh(?:-|$)/i.test(options.language) ? options.zhName : options.enName;
    dialog.querySelector("h2").textContent = `${name2} ${text.update}`;
    dialog.querySelector(".mpi-intro").textContent = text.intro;
    const terms = dialog.querySelectorAll("dt");
    terms[0].textContent = text.current;
    terms[1].textContent = text.latestLabel;
    terms[2].textContent = text.profile;
    dialog.querySelector(".mpi-manual h3").textContent = text.manual;
    dialog.querySelector(".mpi-manual p").textContent = payload?.profileName === "desktop" ? text.manualHintDesktop : text.manualHint;
    const status = dialog.querySelector(".mpi-status");
    const progress = dialog.querySelector(".mpi-progress");
    const command = dialog.querySelector(".mpi-command code");
    const close = dialog.querySelector(
      "[data-action=close]"
    );
    const check = dialog.querySelector(
      "[data-action=check]"
    );
    const update = dialog.querySelector(
      "[data-action=update]"
    );
    const copy = dialog.querySelector("[data-action=copy]");
    setButtonContent(close, text.close, "close");
    close.querySelector("[data-mpi-label]")?.remove();
    close.setAttribute("aria-label", text.close);
    close.title = text.close;
    setButtonContent(check, text.recheck, "refresh");
    setButtonContent(update, text.auto, "download");
    setButtonContent(copy, text.copy, "copy");
    let busy = false;
    const setMessage = (message, kind = "") => {
      status.textContent = message;
      status.dataset.kind = kind;
      status.style.color = kind === "update" ? "#e8b15a" : "";
    };
    const setBusy = (value) => {
      busy = value;
      check.disabled = value;
      copy.disabled = value;
      update.disabled = value || payload?.canAutoUpdate !== true || payload.updateAvailable !== true;
      progress.hidden = !value;
    };
    const render = () => {
      dialog.querySelector("[data-role=current]").textContent = payload === void 0 ? text.unknown : `v${payload.currentVersion}`;
      dialog.querySelector("[data-role=latest]").textContent = payload?.latestVersion === void 0 ? text.unknown : `v${payload.latestVersion}`;
      dialog.querySelector("[data-role=profile]").textContent = payload?.profileName ?? text.unknown;
      const hint = dialog.querySelector(".mpi-manual p");
      if (hint !== null)
        hint.textContent = payload?.profileName === "desktop" ? text.manualHintDesktop : text.manualHint;
      command.textContent = manualPluginUpdateCommand(
        payload?.profileName ?? "",
        options.packageName,
        payload?.latestVersion ?? "latest"
      );
      update.disabled = busy || payload?.canAutoUpdate !== true || payload.updateAvailable !== true;
      if (payload === void 0) setMessage(text.checking);
      else if (payload.notPublished) setMessage(text.unpublished);
      else if (payload.latestCheckFailed) setMessage(text.failed, "error");
      else if (payload.updateAvailable)
        setMessage(`${text.found}: v${payload.latestVersion ?? text.unknown}`, "update");
      else setMessage(text.latest, "success");
      if (payload !== void 0 && !payload.canAutoUpdate && payload.updateAvailable)
        setMessage(text.unavailable, "update");
    };
    const checkNow = async () => {
      if (busy) return;
      setBusy(true);
      setMessage(text.checking);
      try {
        await load();
        setBusy(false);
        render();
      } catch (error) {
        setBusy(false);
        setMessage(
          error instanceof Error ? error.message : text.failed,
          "error"
        );
      }
    };
    const updateNow = async () => {
      if (busy) return;
      setBusy(true);
      setButtonLabel(update, text.updating);
      setMessage(text.updating);
      try {
        payload = await requestStatus(
          options.endpoint,
          "POST",
          controller.signal,
          options.language
        );
        if (payload.updatedVersion) payload.updateAvailable = false;
        applyControls();
        render();
        setMessage(
          payload.autoReload === true ? text.restarting : payload.profileName === "desktop" || payload.restartDesktop === true ? text.restartDesktop : text.restart,
          "success"
        );
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : text.failed,
          "error"
        );
      } finally {
        setButtonLabel(update, text.auto);
        setBusy(false);
      }
    };
    close.addEventListener("click", closeDialog);
    check.addEventListener("click", () => {
      void checkNow();
    });
    update.addEventListener("click", () => {
      void updateNow();
    });
    copy.addEventListener("click", () => {
      void navigator.clipboard?.writeText(command.textContent ?? "").then(() => {
        setButtonLabel(copy, text.copied);
        setTimeout(() => {
          setButtonLabel(copy, text.copy);
        }, 1400);
      }).catch(() => {
        setButtonLabel(copy, text.copyFailed);
      });
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeDialog();
    });
    overlay.addEventListener(
      "keydown",
      (event) => {
        handlePluginUpdateEscape(event, closeDialog);
      },
      true
    );
    overlay.append(dialog);
    (options.root?.closest("dialog[open]") ?? document.body).append(overlay);
    render();
    close.focus();
    void checkNow();
  }
  const observer = new MutationObserver(() => {
    if (frame !== void 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = void 0;
      applyControls();
    });
  });
  observer.observe(options.root ?? document.body, {
    childList: true,
    subtree: true
  });
  applyControls();
  void load().catch(() => {
  });
  return () => {
    controller.abort();
    observer.disconnect();
    closeDialog();
    if (frame !== void 0) window.cancelAnimationFrame(frame);
    (options.root ?? document).querySelectorAll(
      `[data-mpi-check="${options.packageName}"],.mpi-version[data-package="${options.packageName}"]`
    ).forEach((node) => node.remove());
  };
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

// src/plugin-update-ui.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var UPDATE_ICON_PATHS = {
  refresh: ["M13.5 5.5V2.5m0 0h-3m3 0-2.1 2.1A5.5 5.5 0 1 0 13.2 12"],
  download: ["M8 2v8m0 0 3-3m-3 3-3-3M3 13v2h10v-2"],
  copy: ["M5 5h8v8H5z", "M3 3h8"],
  close: ["m4 4 8 8M12 4 4 12"]
};
function createPluginUpdateIcon(name2) {
  const element = document.createElement("span");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of UPDATE_ICON_PATHS[name2]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  element.append(svg);
  return element;
}
function PluginUpdateHeader({ locale }) {
  const language = (0, import_react2.useSyncExternalStore)(
    (fn) => locale?.subscribe(fn) ?? (() => {
    }),
    () => locale?.getSnapshot().active ?? "zh"
  );
  const zh2 = /^zh(?:-|$)/i.test(language);
  const root = (0, import_react2.useRef)(null);
  (0, import_react2.useEffect)(() => {
    if (!root.current) return;
    return observePluginUpdate({
      language,
      root: root.current,
      endpoint: `${BASE}/api/update`,
      packageName: "@michengai/dsh-codex-pet",
      titleRowSelector: ".dcp-project-head",
      linksSelector: ".dcp-project-links",
      zhName: "\u5BA0\u7269",
      enName: "Pets",
      createIcon: createPluginUpdateIcon
    });
  }, [language]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.dcp-project-head{display:flex;align-items:center;justify-content:flex-start;gap:8px 12px;flex-wrap:wrap;margin-bottom:24px}.dcp-project-head h1{display:inline-flex;align-items:baseline;margin:0;white-space:nowrap}.dcp-version{font-size:12px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-tertiary,#9da1aa);margin-left:10px}.dcp-project-links{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.dcp-project-links a,.dcp-project-links button{display:inline-flex;align-items:center;justify-content:center;gap:5px;box-sizing:border-box;min-height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#383838);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,inherit);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap;cursor:pointer}.dcp-project-links a:hover,.dcp-project-links button:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0a);color:var(--dsw-alias-label-primary,inherit)}.dcp-project-links a:focus-visible,.dcp-project-links button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f8cff);outline-offset:2px}.dcp-project-links svg{display:block;flex:none;width:16px;height:16px}` }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { ref: root, className: "dcp-project-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
        zh2 ? "\u5BA0\u7269" : "Pets",
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dcp-version", children: [
          "v",
          "0.1.14"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: "dcp-project-links", children: [
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
              zh2 ? "\u95EE\u9898\u53CD\u9988" : "Issues"
            ]
          }
        )
      ] })
    ] })
  ] });
}

// src/pet-locales.ts
var zh = {
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
function localizePet(pet, locale) {
  if (pet.source !== "builtin") return pet;
  const entry = BUILTINS.find(([id]) => id === pet.id);
  if (!entry) return pet;
  const [name2, description] = /^zh(?:-|$)/i.test(locale) ? zh[entry[0]] : [entry[1], entry[2]];
  return { ...pet, name: name2, description };
}

// node_modules/@radix-ui/react-icons/dist/react-icons.esm.js
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
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: item.title }),
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
    !expanded && state.items.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => setExpanded(true), children: t("\u8FD8\u6709 {count} \u4E2A\u4F1A\u8BDD", { count: state.items.length - 1 }) }),
    expanded && state.hidden > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { onClick: () => void run({ type: "restore" }), children: t("\u6062\u590D {count} \u6761\u5DF2\u5173\u95ED\u901A\u77E5", { count: state.hidden }) }),
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

// src/styles.ts
var styles = `
.dcp{--pet-bg:var(--dsw-alias-bg-base,#181818);--pet-card:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#242424));--pet-line:var(--dsw-alias-border-l2,#343434);--pet-text:var(--dsw-alias-label-primary,#d7d7d7);--pet-muted:var(--dsw-alias-label-secondary,#929292);font-family:Arial,"Microsoft YaHei",sans-serif;color:var(--pet-text);font-size:13px;line-height:1.45;color-scheme:inherit}
.dcp *{box-sizing:border-box}.dcp button,.dcp input,.dcp textarea{font:inherit}.dcp button{border:0;color:var(--pet-text);background:transparent;cursor:pointer}.dcp button:disabled{opacity:.4;cursor:default}.dcp button:focus-visible,.dcp input:focus-visible,.dcp textarea:focus-visible{outline:2px solid #9bc8ff;outline-offset:3px}.dcp button:hover:not(:disabled){background:color-mix(in srgb,var(--pet-text) 8%,transparent)}
.dcp-page{max-width:768px;margin:0 auto;padding:0 0 32px}.dcp-page h1{font-size:24px;font-weight:600;margin:0 0 32px;line-height:1.3}.dcp-page h2{font-size:14px;font-weight:600;margin:0}.dcp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.dcp-sub{color:var(--pet-muted);margin:4px 0 0;font-size:12px}.dcp-actions{display:flex;align-items:center;gap:8px}.dcp .dcp-button{border-radius:7px;padding:5px 9px;background:color-mix(in srgb,var(--pet-text) 3%,transparent);white-space:nowrap;font-weight:500}.dcp .dcp-icon{display:inline-flex;align-items:center;justify-content:center;padding:6px;border-radius:6px}.dcp svg{width:16px;height:16px;flex-shrink:0}
.dcp-card{border:1px solid var(--pet-line);border-radius:16px;background:var(--pet-card);overflow:hidden;padding:0 16px}.dcp-row{display:flex;align-items:center;gap:18px;min-height:88px;border-bottom:1px solid var(--pet-line)}.dcp-preview{width:58px;flex-shrink:0;display:flex;justify-content:center;align-items:center}.dcp-info{flex:1;min-width:0}.dcp-name{font-size:13px;font-weight:600;margin-bottom:3px}.dcp-description{font-size:12px;color:var(--pet-muted);overflow-wrap:anywhere}.dcp-folder{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.dcp-path{font-family:Consolas,monospace;font-size:11px;color:var(--pet-muted);overflow-wrap:anywhere}.dcp .dcp-folder-button{display:flex;align-items:center;gap:6px;color:var(--pet-muted);white-space:nowrap}.dcp-appearance{margin-top:48px}.dcp-size{margin-top:14px;min-height:62px;display:flex;align-items:center;justify-content:space-between;padding:12px 16px}.dcp-size label{font-weight:600}.dcp-size input{width:160px;height:2px;accent-color:white;cursor:pointer}.dcp-size small{display:block;font-size:12px;color:var(--pet-muted);font-weight:400;margin-top:2px}.dcp-note{margin:12px 0;color:var(--pet-muted);font-size:12px}.dcp-error{padding:12px;border:1px solid #845344;border-radius:8px;color:#edb7a3;margin:12px 0;font-size:12px}.dcp-empty{padding:32px 0;text-align:center;color:var(--pet-muted)}
.dcp-floating{position:fixed;z-index:2147483000;pointer-events:none}.dcp-pet-button{display:block!important;padding:0!important;background:transparent!important;touch-action:none;cursor:grab!important;pointer-events:auto;user-select:none;-webkit-user-select:none}.dcp-pet-button:active{cursor:grabbing!important}.dcp-sprite{background-repeat:no-repeat;pointer-events:none;flex-shrink:0}.dcp-bubble{position:absolute;bottom:calc(100% + 16px);right:0;min-width:160px;max-width:240px;width:max-content;padding:10px 16px!important;border:1px solid var(--pet-line)!important;border-radius:28px!important;background:var(--pet-card)!important;text-align:left;box-shadow:0 2px 12px #0002;pointer-events:auto}.dcp-bubble strong{display:block;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}.dcp-bubble span{display:block;font-size:12px;color:var(--pet-muted)}.dcp-menu{position:absolute;right:0;bottom:100%;width:160px;padding:6px;border:1px solid var(--pet-line);background:var(--pet-card);border-radius:10px;pointer-events:auto;box-shadow:0 8px 32px #0004}.dcp-menu button{display:block;width:100%;text-align:left;padding:8px;border-radius:5px}.dcp-menu hr{border:0;border-top:1px solid var(--pet-line);margin:5px}
.dcp-dialog{color:var(--pet-text);background:var(--pet-card);border:1px solid var(--pet-line);border-radius:16px;width:min(480px,calc(100vw - 32px));padding:24px}.dcp-dialog::backdrop{background:#0008}.dcp-dialog h2{font-size:19px;margin:0 0 12px}.dcp-dialog textarea{display:block;resize:vertical;width:100%;min-height:120px;color:var(--pet-text);background:var(--pet-bg);border:1px solid var(--pet-line);border-radius:8px;padding:12px;margin:16px 0}.dcp-dialog footer{display:flex;justify-content:flex-end;gap:8px}.dcp-dialog .dcp-primary{background:#e6e6e6!important;color:#222!important}.dcp-creation{border-top:1px solid var(--pet-line);padding-top:12px;margin-top:12px}
.dcp-light{--pet-bg:#fff;--pet-card:#f7f7f7;--pet-line:#e4e4e4;--pet-text:#252525;--pet-muted:#727272;color-scheme:light}.dcp-light.dcp-light .dcp-size input{accent-color:#222}
.dcp-size input{-webkit-appearance:none;appearance:none;background:var(--pet-line);height:2px}.dcp-size input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--pet-text)}
@media(max-width:600px){.dcp-page h1{font-size:22px;margin-bottom:24px}.dcp-head{flex-wrap:wrap;gap:10px}.dcp-row{min-height:86px;gap:8px}.dcp-preview{width:44px}.dcp-description{font-size:11px}.dcp-card{padding:0 12px}.dcp-folder{align-items:flex-start}.dcp-folder-button{font-size:11px!important}.dcp-size{padding:12px}.dcp-size input{width:130px}.dcp-appearance{margin-top:32px}}
@media(prefers-reduced-motion:reduce){.dcp *{animation:none!important;transition:none!important}}
`;

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
    let frame = 0, last = null, id = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paint = () => {
      const row = pet.version === 2 && look ? look.row : animation.row;
      const col = pet.version === 2 && look ? look.col : frame;
      node.style.backgroundPosition = `${-col * size}px ${-row * size * 208 / 192}px`;
    };
    paint();
    const tick = (time) => {
      if (last === null || document.hidden) last = time;
      if (!document.hidden && time - last >= animation.durations[frame]) {
        last = time;
        frame = (frame + 1) % animation.durations.length;
        paint();
      }
      id = requestAnimationFrame(tick);
    };
    if (animate && !look && !reduced.matches) id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
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
  locale
}) {
  const t = translator(controller.language);
  const { library, error } = controller;
  const [busy, setBusy] = (0, import_react5.useState)(false), [showCreate, setShowCreate] = (0, import_react5.useState)(false), [description, setDescription] = (0, import_react5.useState)("");
  const [size, setSize] = (0, import_react5.useState)(library?.config.size ?? 120);
  const dialog = (0, import_react5.useRef)(null);
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
          "button",
          {
            className: "dcp-icon",
            title: t("\u5237\u65B0\u5BA0\u7269\u5E93"),
            "aria-label": t("\u5237\u65B0\u5BA0\u7269\u5E93"),
            disabled: busy,
            onClick: () => void act(controller.refresh),
            children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReloadIcon, {})
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            className: "dcp-button",
            disabled: !library || busy,
            onClick: () => setShowCreate(true),
            children: t("\u521B\u5EFA")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            className: "dcp-button",
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
          "button",
          {
            className: "dcp-button",
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
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            className: "dcp-folder-button",
            disabled: !library || busy,
            onClick: () => void act(controller.folder),
            children: [
              t("\u6253\u5F00\u6587\u4EF6\u5939"),
              " ",
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ArrowTopRightIcon, {})
            ]
          }
        )
      ] })
    ] }),
    !!library?.warnings.length && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "dcp-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("summary", { children: t("\u6709 {count} \u9879\u5BA0\u7269\u8D44\u6E90\u9700\u8981\u68C0\u67E5", {
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
        className: "dcp-dialog",
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
                setDescription("");
              }).catch(
                (error2) => setCreationError(
                  error2 instanceof Error ? error2.message : t("\u521B\u5EFA\u5931\u8D25")
                )
              ).finally(() => setBusy(false));
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { children: t("\u521B\u5EFA\u5BA0\u7269") }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "textarea",
                {
                  autoFocus: true,
                  "aria-label": t("\u5BA0\u7269\u63CF\u8FF0"),
                  placeholder: t(
                    "\u4F8B\u5982\uFF1A\u4E00\u53EA\u6234\u7740\u5706\u773C\u955C\u7684\u5C0F\u6D77\u736D\uFF0C\u5B89\u9759\u3001\u597D\u5947\uFF0C\u6BDB\u7ED2\u73A9\u5177\u98CE\u683C\u2026"
                  ),
                  maxLength: 2e3,
                  value: description,
                  onChange: (event) => setDescription(event.target.value),
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
                  "button",
                  {
                    type: "button",
                    className: "dcp-button",
                    onClick: () => setShowCreate(false),
                    children: t("\u53D6\u6D88")
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "button",
                  {
                    type: "submit",
                    className: "dcp-button dcp-primary",
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
      const box = root.current?.getBoundingClientRect();
      if (box)
        setLook(
          lookCell(
            event.clientX - box.left - config.size / 2,
            event.clientY - box.top - petHeight / 2
          )
        );
    };
    window.addEventListener("mousemove", track);
    return () => window.removeEventListener("mousemove", track);
  }, [activity.pose, action, pet.version, config.size, petHeight]);
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
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: activity.title }),
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
  return list.current;
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
function createNotifications(sessions, pending, notify, now = Date.now) {
  const records = /* @__PURE__ */ new Map();
  const bindings = /* @__PURE__ */ new Map();
  const dismissed = /* @__PURE__ */ new Map();
  const busy = /* @__PURE__ */ new Set();
  const answered = /* @__PURE__ */ new Set();
  let state = { items: [], activity: IDLE, hidden: 0 }, latestFirst = false;
  let publishing = false;
  let lastPublished = "";
  const publish = () => {
    if (publishing) return;
    publishing = true;
    try {
      const list = sessions.list.getSnapshot(), requests = pending.getSnapshot(), statuses = sessions.status?.getSnapshot();
      const current = selectedSessionId(list);
      const ids = new Set(list.ids.filter((id) => list.byId[id] && list.byId[id].origin !== "subagent"));
      for (const id of records.keys()) if (!ids.has(id)) {
        records.delete(id);
        dismissed.delete(id);
      }
      for (const [id, bound] of bindings) if (!ids.has(id)) {
        bound.off();
        bindings.delete(id);
        records.delete(id);
        dismissed.delete(id);
      }
      const items = [];
      let hidden = 0;
      for (const id of ids) {
        const row = list.byId[id];
        if (!row) continue;
        const status = statuses?.get(id);
        const binding = sessions.binding(id);
        let record = records.get(id);
        if (!record) {
          record = { round: 0, running: row.running, completion: !!status?.completionUnread || !!row.completed, error: null, revision: binding?.eventSource?.getSnapshot().revision ?? -1, updatedAt: row.updatedAt ?? now(), lastPose: "" };
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
        const agentError = snapshot?.lastAgentError ?? snapshot?.promptError?.error?.message ?? null;
        if (agentError && agentError !== record.snapshotError) record.error = agentError;
        record.snapshotError = agentError;
        if (stopped && !record.suppressStopCompletion && !record.finished && !record.error) {
          record.completion = true;
          record.updatedAt = now();
        }
        if ((status?.completionUnread || row.completed) && !running && (!record.finished || record.finished === "completed")) record.completion = true;
        const request2 = requests.get(id);
        const activity = selectActivity([{ id, title: row.title ?? row.displayTitle, running, waiting: !!request2, error: running ? null : record.error, completed: !running && record.completion }]);
        if (activity.pose === "idle") continue;
        if (record.lastPose && record.lastPose !== activity.pose || record.requestKey !== request2?.key) record.updatedAt = now();
        record.lastPose = activity.pose;
        record.requestKey = request2?.key;
        const token = `${record.round}:${request2?.key ?? ""}`;
        if (dismissed.get(id) === token) {
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
        dismissed.set(item.id, item.token);
        publish();
        return;
      }
      if (command.type === "open") {
        if (!sessions.open) throw new Error("\u5BBF\u4E3B\u672A\u63D0\u4F9B\u6253\u5F00\u4F1A\u8BDD\u80FD\u529B");
        sessions.open(item.id);
        if (item.pose === "review") dismissed.set(item.id, item.token);
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
  const binding = sessions.binding(id);
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
var PAW = '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>';
function observePetSettingsIcon() {
  const apply2 = () => {
    for (const button of document.querySelectorAll(".dcu-settings-link")) {
      if (!["\u5BA0\u7269", "Pets"].includes(button.textContent?.trim() ?? "")) continue;
      const svg = button.querySelector("svg");
      if (!svg || svg.getAttribute("data-pet-icon") === "codex-paw") continue;
      svg.setAttribute("data-pet-icon", "codex-paw");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.innerHTML = PAW;
    }
  };
  apply2();
  const observer = new MutationObserver(apply2);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

// src/global-overlay.tsx
var import_react6 = require("react");
var import_react_dom = require("react-dom");
function GlobalOverlay({ children }) {
  const [container, setContainer] = (0, import_react6.useState)(null);
  (0, import_react6.useEffect)(() => {
    const element = document.createElement("div");
    element.setAttribute("data-dsh-pet-overlay", "");
    element.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none";
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
function openSettings() {
  const trigger = document.querySelector("[data-dcu-settings-trigger]");
  if (trigger)
    trigger.dispatchEvent(
      new CustomEvent("dcu-settings-open-section", {
        bubbles: true,
        cancelable: true,
        detail: { labels: ["\u5BA0\u7269", "Pets"] }
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
  const settingsDialog = (0, import_react7.useRef)(null);
  (0, import_react7.useEffect)(() => {
    const show = () => {
      if (!settingsDialog.current?.open) settingsDialog.current?.showModal();
    };
    window.addEventListener("dcp-open-settings", show);
    return () => window.removeEventListener("dcp-open-settings", show);
  }, []);
  const [state, setState] = (0, import_react7.useState)({
    items: [],
    activity: IDLE,
    hidden: 0
  });
  const notifications = (0, import_react7.useRef)(
    null
  );
  (0, import_react7.useEffect)(() => {
    const engine = createNotifications(sessions, pending, setState);
    notifications.current = engine;
    return () => {
      notifications.current = null;
      engine.dispose();
    };
  }, [sessions, pending]);
  (0, import_react7.useEffect)(observePetSettingsIcon, []);
  const command = async (value) => {
    const engine = notifications.current;
    if (!engine) throw new Error("\u4F1A\u8BDD\u670D\u52A1\u5C1A\u672A\u5C31\u7EEA");
    if (value.type === "sort") {
      engine.sort(value.latest);
      return;
    }
    await engine.command(value);
  };
  const [externalDisplay, setExternalDisplay] = (0, import_react7.useState)(false);
  const actions = (0, import_react7.useRef)({
    command,
    updateConfig: controller.update,
    openSettings
  });
  actions.current = { command, updateConfig: controller.update, openSettings };
  const provider = (0, import_react7.useRef)(
    null
  );
  (0, import_react7.useEffect)(() => {
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
  (0, import_react7.useEffect)(() => {
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
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "dialog",
      {
        ref: settingsDialog,
        className: "dcp dcp-dialog",
        "aria-label": t("\u5BA0\u7269\u8BBE\u7F6E"),
        style: {
          pointerEvents: "auto",
          width: "min(800px, calc(100vw - 32px))",
          maxHeight: "85vh",
          overflow: "auto"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              className: "dcp-button",
              onClick: () => settingsDialog.current?.close(),
              children: t("\u5173\u95ED\u8BBE\u7F6E")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
          )
        ]
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
    return live && "sessionStatus" in live ? live.sessionStatus : void 0;
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
  const sessions = compatibleSessions(
    ctx.sessions,
    (id) => {
      const open = ctx.sessions.open;
      if (open) return open.call(ctx.sessions, id);
      const uiWorkspace = probe(ctx, "uiWorkspace");
      if (uiWorkspace) return uiWorkspace.openSession(id);
    },
    liveSessionStatus(ctx)
  );
  const pending = compatiblePending(sessions, () => {
    const live = probe(ctx, "uiSession");
    if (live && "sessionStatus" in live && live.sessionStatus) return pendingFromSessionStatus(live.sessionStatus);
    return live && "pendingInteractions" in live ? live.pendingInteractions : void 0;
  });
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "codex-pet",
        label: () => translator(ctx.locale.getSnapshot().active)("\u5BA0\u7269"),
        order: 12
      },
      () => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Page, { sessions, locale: ctx.locale })
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
