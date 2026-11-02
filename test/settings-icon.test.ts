import assert from "node:assert/strict";
import test from "node:test";
import {
  PET_NAV_ICON_MARKER,
  PET_NAV_ROW_SELECTOR,
  applyPetSettingsIcon,
  isPetNavRow,
  observePetSettingsIcon,
  restorePetSettingsIcon,
} from "../src/settings-icon.ts";

/** 最小 DOM 桩：只覆盖设置导航图标补丁实际用到的 API。 */
class FakeElement {
  ownerDocument: FakeDocument;
  tagName: string;
  attrs: Record<string, string> = {};
  children: FakeElement[] = [];
  parent: FakeElement | null = null;
  id = "";
  className = "";
  textContent = "";

  constructor(doc: FakeDocument, tag: string) {
    this.ownerDocument = doc;
    this.tagName = tag.toUpperCase();
  }

  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attrs[name] = String(value);
  }

  removeAttribute(name: string) {
    delete this.attrs[name];
  }

  hasAttribute(name: string): boolean {
    return Object.hasOwn(this.attrs, name);
  }

  appendChild(child: FakeElement): FakeElement {
    child.parent?.remove();
    child.parent = this;
    this.children.push(child);
    return child;
  }

  prepend(child: FakeElement): FakeElement {
    child.parent?.remove();
    child.parent = this;
    this.children.unshift(child);
    return child;
  }

  remove(): void {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter(
      (child) => child !== this,
    );
    this.parent = null;
  }

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    if (selector === ":scope > svg") {
      return this.children.filter((child) => child.tagName === "SVG");
    }
    const found: FakeElement[] = [];
    const visit = (node: FakeElement): void => {
      for (const child of node.children) {
        if (matches(child, selector)) found.push(child);
        visit(child);
      }
    };
    visit(this);
    return found;
  }
}

interface FakeDocument {
  createElement(tag: string): FakeElement;
}

function matches(element: FakeElement, selector: string): boolean {
  if (selector.startsWith(".")) {
    return element.className.split(/\s+/).includes(selector.slice(1));
  }
  if (selector.startsWith("[") && selector.endsWith("]")) {
    return element.getAttribute(selector.slice(1, -1)) != null;
  }
  return element.tagName === selector.toUpperCase();
}

function createButton(label: string, svgParent: "direct" | "wrapped" = "direct") {
  const doc: FakeDocument = { createElement: (tag) => new FakeElement(doc, tag) };
  const button = new FakeElement(doc, "button");
  const svg = new FakeElement(doc, "svg");
  const labelNode = new FakeElement(doc, "span");
  labelNode.textContent = label;
  if (svgParent === "direct") button.appendChild(svg);
  else {
    const wrapper = new FakeElement(doc, "span");
    wrapper.appendChild(svg);
    button.appendChild(wrapper);
  }
  button.appendChild(labelNode);
  // 宿主按钮的 textContent 包含标签文本；桩里显式赋值即可。
  button.textContent = label;
  return { button, element: button as unknown as Element, svg };
}

test("宠物设置行使用纯属性标记，宿主 svg 内容保持不变", () => {
  const { button, element, svg } = createButton("宠物");
  assert.equal(isPetNavRow(element), true);
  assert.equal(applyPetSettingsIcon(element), true);

  assert.equal(button.getAttribute(PET_NAV_ICON_MARKER), "");
  assert.equal(button.children.length, 2, "禁止插入额外的 span 节点");
  assert.equal(button.children[0], svg, "宿主 svg 必须保留在原位");
  assert.equal(svg.children.length, 0, "不得改写宿主 svg 内容");

  assert.equal(applyPetSettingsIcon(element), false, "重复应用保持幂等");
});

test("英文文案同样适配", () => {
  const { button, element } = createButton("Pets");
  assert.equal(isPetNavRow(element), true);
  assert.equal(applyPetSettingsIcon(element), true);
});

test("其他插件的设置行不注入图标", () => {
  const { button, element } = createButton("技能");
  assert.equal(isPetNavRow(element), false);
  assert.equal(applyPetSettingsIcon(element), false);
});

test("卸载后移除 marker 属性，宿主 svg 保持原样", () => {
  const { button, element, svg } = createButton("宠物");
  applyPetSettingsIcon(element);
  assert.equal(restorePetSettingsIcon(element), true);
  assert.equal(button.getAttribute(PET_NAV_ICON_MARKER), null);
  assert.equal(button.querySelector("svg"), svg);
  assert.equal(svg.children.length, 0);
  assert.equal(restorePetSettingsIcon(element), false, "重复卸载必须安全");
});

test("设置面板打开时，密集 DOM 变更被合并成有限次全量扫描", async () => {
  const doc = { createElement: (tag: string) => new FakeElement(doc as never, tag) } as {
    createElement(tag: string): FakeElement;
  };
  const body = new FakeElement(doc as never, "body");
  const head = new FakeElement(doc as never, "head");
  const surface = new FakeElement(doc as never, "div");
  surface.className = "dcu-settings-page";
  const petRow = createButton("宠物").button;
  body.appendChild(petRow);
  const byId = new Map<string, FakeElement>();
  let rowQueries = 0;

  const fakeDocument = {
    body,
    head,
    documentElement: head,
    createElement: (tag: string) => new FakeElement(fakeDocument as never, tag),
    getElementById: (id: string) => byId.get(id) ?? null,
    querySelector: (selector: string) =>
      selector.includes("dcu-settings-page") ? surface : null,
    querySelectorAll: (selector: string) => {
      if (selector === PET_NAV_ROW_SELECTOR) {
        rowQueries += 1;
        return [petRow];
      }
      return [];
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const observers: { callback: () => void; disconnected: boolean }[] = [];
  class FakeObserver {
    record: { callback: () => void; disconnected: boolean };
    constructor(callback: () => void) {
      this.record = { callback, disconnected: false };
      observers.push(this.record);
    }
    observe() {}
    disconnect() {
      this.record.disconnected = true;
    }
  }
  const globals = globalThis as Record<string, unknown>;
  const saved = {
    document: globals.document,
    window: globals.window,
    MutationObserver: globals.MutationObserver,
  };
  const timers = new Set<ReturnType<typeof setTimeout>>();
  globals.document = fakeDocument;
  globals.window = {
    setTimeout: (callback: () => void, delay: number) => {
      const handle = setTimeout(() => {
        timers.delete(handle);
        callback();
      }, delay);
      timers.add(handle);
      return handle;
    },
    clearTimeout: (handle: ReturnType<typeof setTimeout>) => {
      timers.delete(handle);
      clearTimeout(handle);
    },
    requestAnimationFrame: (callback: () => void) => {
      const handle = setTimeout(() => {
        timers.delete(handle);
        callback();
      }, 0);
      timers.add(handle);
      return handle;
    },
    cancelAnimationFrame: (handle: ReturnType<typeof setTimeout>) => {
      timers.delete(handle);
      clearTimeout(handle);
    },
  };
  globals.MutationObserver = FakeObserver;
  try {
    const dispose = observePetSettingsIcon();
    const afterInstall = rowQueries;
    assert.ok(afterInstall >= 1, "安装时扫描一次");
    // 模拟流式输出：连续 30 次 DOM 变更在限流窗口内不得触发扫描。
    for (let index = 0; index < 30; index += 1) observers[0].callback();
    await new Promise((done) => setTimeout(done, 40));
    assert.equal(rowQueries, afterInstall, "限流窗口内不得全量扫描");
    // 窗口到期后合并成一次。
    await new Promise((done) => setTimeout(done, 180));
    assert.equal(rowQueries - afterInstall, 1, "30 次变更只合并成一次扫描");
    // 紧接着的下一次变更又落入新的窗口，仍然延迟。
    observers[0].callback();
    await new Promise((done) => setTimeout(done, 40));
    assert.equal(rowQueries - afterInstall, 1, "新窗口内不得立刻扫描");
    await new Promise((done) => setTimeout(done, 180));
    assert.equal(rowQueries - afterInstall, 2, "窗口到期后补一次扫描");
    dispose();
    assert.equal(observers[0].disconnected, true);
  } finally {
    globals.document = saved.document;
    globals.window = saved.window;
    globals.MutationObserver = saved.MutationObserver;
    for (const handle of timers) clearTimeout(handle);
    timers.clear();
  }
});
