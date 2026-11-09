/**
 * DSH 设置侧边导航中的宠物图标。
 *
 * 图标沿用 Codex 内置的 Lucide PawPrint 几何，但不再改写宿主 svg 的内容：
 * 第三方皮肤会按 svg 内部形状识别图标并隐藏其子节点，直接替换 innerHTML
 * 会与皮肤互相覆盖，最终导致图标不可见。这里改为独立的 CSS mask span，
 * 宿主 svg 只负责被隐藏，不参与皮肤的内容级识别。
 */

import React from "react";

/** Codex 内置 Lucide PawPrint 几何（viewBox: 0 0 24 24，描边图标）。 */
const PAW = '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>';

/** 原生 settings.section.icon 插槽图标组件 */
export function PetNavIcon({ size = 16 }: { size?: number }): React.ReactElement {
  return React.createElement(
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
      strokeLinejoin: "round",
    },
    React.createElement("circle", { cx: 11, cy: 4, r: 2 }),
    React.createElement("circle", { cx: 18, cy: 8, r: 2 }),
    React.createElement("circle", { cx: 20, cy: 16, r: 2 }),
    React.createElement("path", {
      d: "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z",
    }),
  );
}

/** mask 只取 alpha 通道，因此把描边固定为黑色。 */
const PAW_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PAW}</svg>`,
)}")`;

export const PET_NAV_ICON_MARKER = "data-dcp-nav-icon";
/** 原生 DSH 设置弹窗与 dsh-codex-ui 设置页的导航按钮。 */
export const PET_NAV_ROW_SELECTOR =
  '[role="dialog"] nav button, .dcu-settings-link';

const NAV_ICON_STYLE_ID = "dcp-settings-nav-icon-style";
const NAV_ICON_CSS = [
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
  `}`,
].join("\n");

/** 注入导航图标的样式；重复安装时复用同一个 style 元素。 */
function ensureNavIconStyle(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(NAV_ICON_STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = NAV_ICON_STYLE_ID;
  style.textContent = NAV_ICON_CSS;
  (document.head ?? document.documentElement).appendChild(style);
}

const PET_LABELS = new Set([
  "宠物",
  "Pets",
  "ペット",
  "Mascotas",
  "Animaux",
  "Haustiere",
  "Питомцы",
  "Mascotes",
]);

/** 只认本插件的设置分区文案，避免误改其他插件的导航行。 */
export function isPetNavRow(button: Element): boolean {
  const label = button.textContent?.trim() ?? "";
  return PET_LABELS.has(label);
}

/**
 * 100% 对齐 dshmarket：用纯属性标记控制 ::before 伪元素渲染图标。
 * 不修改任何 DOM 节点，避免移动端列表项排版下与文字重叠冲突。
 */
export function applyPetSettingsIcon(button: Element): boolean {
  const isOwn = isPetNavRow(button);
  if (isOwn) {
    const hasSlotIcon = Array.from(button.children).some((child) =>
      child.tagName === "SPAN" && child.className && String(child.className).includes("navIcon")
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

/** 移除本插件添加的标记，宿主 svg 恢复显示。 */
export function restorePetSettingsIcon(button: Element): boolean {
  if (!button.hasAttribute(PET_NAV_ICON_MARKER)) return false;
  button.removeAttribute(PET_NAV_ICON_MARKER);
  return true;
}

export function observePetSettingsIcon(): () => void {
  if (typeof document === "undefined" || document.body === null)
    return () => {};
  ensureNavIconStyle();

  let disposed = false;
  let frame: number | undefined;
  let timer: number | undefined;
  let lastRun = Number.NEGATIVE_INFINITY;
  /** 当前带标记的导航行，用来判断是否还需要扫描残留。 */
  const markedRows = new Set<Element>();
  const hasSettingsSurface = () =>
    document.querySelector(
      '.dcu-settings-page, .dcu-settings-link, [data-shortcut-modal="settings"]',
    ) !== null;
  /** 上一拍看到的面板状态：用于识别「面板刚打开」，那一拍要立刻补丁。 */
  let surfaceOpen = false;
  const sync = () => {
    frame = undefined;
    if (disposed) return;
    lastRun = performance.now();
    surfaceOpen = hasSettingsSurface();
    // 设置面板未打开且本插件没加过标记时跳过整页扫描（不再额外查询残留标记）。
    if (!surfaceOpen && markedRows.size === 0) return;
    for (const row of document.querySelectorAll(PET_NAV_ROW_SELECTOR)) {
      applyPetSettingsIcon(row);
      if (row.hasAttribute(PET_NAV_ICON_MARKER)) markedRows.add(row);
      else markedRows.delete(row);
    }
    for (const row of markedRows) if (!row.isConnected) markedRows.delete(row);
  };
  // 整页查询有固定成本：限制最小间隔并合并到一帧，避免流式输出时每次 DOM 变更都全文档扫描。
  const MIN_INTERVAL = 150;
  const schedule = () => {
    if (disposed) return;
    const open = hasSettingsSurface();
    // 面板刚打开：立刻打补丁，不要排在限流窗口后面（否则图标会晚几十毫秒才出现）。
    if (open && !surfaceOpen) {
      if (timer !== undefined) { window.clearTimeout(timer); timer = undefined; }
      if (frame !== undefined) { window.cancelAnimationFrame(frame); frame = undefined; }
      sync();
      return;
    }
    if (!open) surfaceOpen = false;
    if (frame !== undefined || timer !== undefined) return;
    const wait = MIN_INTERVAL - (performance.now() - lastRun);
    if (wait > 0) {
      timer = window.setTimeout(() => {
        timer = undefined;
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
    characterData: true,
  });
  return () => {
    disposed = true;
    observer.disconnect();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    if (timer !== undefined) window.clearTimeout(timer);
    for (const row of document.querySelectorAll(`[${PET_NAV_ICON_MARKER}]`)) {
      restorePetSettingsIcon(row);
    }
    document.getElementById(NAV_ICON_STYLE_ID)?.remove();
  };
}
