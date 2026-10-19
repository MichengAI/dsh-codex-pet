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
export const PET_NAV_ICON_CLASS = "dcp-settings-nav-icon";
/** 原生 DSH 设置弹窗与 dsh-codex-ui 设置页的导航按钮。 */
export const PET_NAV_ROW_SELECTOR =
  '[role="dialog"] nav button, .dcu-settings-link';

const NAV_ICON_STYLE_ID = "dcp-settings-nav-icon-style";
const NAV_ICON_CSS = `[${PET_NAV_ICON_MARKER}]>svg{display:none!important}.${PET_NAV_ICON_CLASS}{display:inline-block;flex:none;width:16px;height:16px;background:currentColor;-webkit-mask:${PAW_MASK} center/contain no-repeat;mask:${PAW_MASK} center/contain no-repeat}`;

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
 * 给宠物设置行补一个 mask 图标。
 * 不修改宿主 svg，避免与皮肤（orca-link 等）的 svg 内容级识别互相覆盖。
 */
export function applyPetSettingsIcon(button: Element): boolean {
  if (!isPetNavRow(button)) return false;
  // 只认宿主直接渲染在按钮里的图标；包裹型图标插入额外节点会打乱布局
  if (button.querySelector(":scope > svg") === null) return false;
  if (
    button.getAttribute(PET_NAV_ICON_MARKER) === "pet" &&
    button.querySelector(`.${PET_NAV_ICON_CLASS}`) !== null
  )
    return false;

  const doc = button.ownerDocument;
  if (!doc) return false;
  button.setAttribute(PET_NAV_ICON_MARKER, "pet");

  const icon = doc.createElement("span");
  icon.className = PET_NAV_ICON_CLASS;
  icon.setAttribute("aria-hidden", "true");
  button.prepend(icon);
  return true;
}

/** 移除本插件添加的图标与标记，宿主 svg 内容始终未被动过。 */
export function restorePetSettingsIcon(button: Element): boolean {
  button.removeAttribute(PET_NAV_ICON_MARKER);
  const icon = button.querySelector(`.${PET_NAV_ICON_CLASS}`);
  if (!icon) return false;
  icon.remove();
  return true;
}

export function observePetSettingsIcon(): () => void {
  if (typeof document === "undefined" || document.body === null)
    return () => {};
  ensureNavIconStyle();

  let disposed = false;
  let scheduled = false;
  const sync = () => {
    scheduled = false;
    if (disposed) return;
    for (const row of document.querySelectorAll(PET_NAV_ROW_SELECTOR)) {
      applyPetSettingsIcon(row);
    }
  };
  // 合并同一轮 DOM 变更；React 重新渲染时只处理一次。
  const schedule = () => {
    if (scheduled || disposed) return;
    scheduled = true;
    queueMicrotask(sync);
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
    for (const row of document.querySelectorAll(`[${PET_NAV_ICON_MARKER}]`)) {
      restorePetSettingsIcon(row);
    }
    document.getElementById(NAV_ICON_STYLE_ID)?.remove();
  };
}
