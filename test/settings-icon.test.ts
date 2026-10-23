import assert from "node:assert/strict";
import test from "node:test";
import {
  PET_NAV_ICON_MARKER,
  applyPetSettingsIcon,
  isPetNavRow,
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
