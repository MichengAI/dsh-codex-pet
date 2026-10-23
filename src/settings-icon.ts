/**
 * DSH 设置侧边导航中的宠物图标。
 *
 * 图标沿用 Codex 内置的 Lucide PawPrint 几何，但不再改写宿主 svg 的内容：
 * 第三方皮肤会按 svg 内部形状识别图标并隐藏其子节点，直接替换 innerHTML
 * 会与皮肤互相覆盖，最终导致图标不可见。这里改为独立的 CSS mask span，
 * 宿主 svg 只负责被隐藏，不参与皮肤的内容级识别。
 */

/** Codex 内置 Lucide PawPrint 几何（viewBox: 0 0 24 24，描边图标）。 */
const PAW = '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>';

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

/** 只认本插件的设置分区文案，避免误改其他插件的导航行。 */
export function isPetNavRow(button: Element): boolean {
  const label = button.textContent?.trim() ?? "";
  return label === "宠物" || label === "Pets";
}

/**
 * 100% 对齐 dshmarket：用纯属性标记控制 ::before 伪元素渲染图标。
 * 不修改任何 DOM 节点，避免移动端列表项排版下与文字重叠冲突。
 */
export function applyPetSettingsIcon(button: Element): boolean {
  const isOwn = isPetNavRow(button);
  if (isOwn) {
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
  const hasSettingsSurface = () =>
    document.querySelector(
      '.dcu-settings-page, .dcu-settings-link, [data-shortcut-modal="settings"]',
    ) !== null;
  const sync = () => {
    frame = undefined;
    if (disposed) return;
    // 设置面板未打开且没有残留图标时跳过整页扫描。
    if (
      !hasSettingsSurface() &&
      document.querySelector(`[${PET_NAV_ICON_MARKER}]`) === null
    )
      return;
    for (const row of document.querySelectorAll(PET_NAV_ROW_SELECTOR)) {
      applyPetSettingsIcon(row);
    }
  };
  // 每帧最多处理一次，避免流式输出时每个 DOM 变更都整页查询。
  const schedule = () => {
    if (frame !== undefined || disposed) return;
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
    for (const row of document.querySelectorAll(`[${PET_NAV_ICON_MARKER}]`)) {
      restorePetSettingsIcon(row);
    }
    document.getElementById(NAV_ICON_STYLE_ID)?.remove();
  };
}
