import { updateErrorMessage } from "./update-errors.ts";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
/** 用宿主 Modal 原语承载更新弹窗：它自带顶层图层、遮罩、焦点陷阱与 Escape 处理，
 *  自己手写 position:fixed 覆盖层在「设置弹窗内部」这类嵌套场景会被裁剪或压到下面。 */
import { Modal } from "@deepseek-ai/dsh-client-ui-primitives";
/** 直接复用同系列插件更新弹窗，仅补充宠物的未发布状态与嵌入容器适配。 */
export type PluginUpdateUiOptions = {
  readonly language: string;
  readonly root?: HTMLElement;
  readonly endpoint: string;
  readonly packageName: string;
  readonly titleRowSelector: string;
  readonly linksSelector: string;
  readonly zhName: string;
  readonly enName: string;
  readonly createIcon: (name: PluginUpdateIconName) => HTMLElement;
};

export type PluginUpdateIconName = "refresh" | "download" | "copy" | "close";

type UpdatePayload = {
  packageName: string;
  currentVersion: string;
  latestVersion?: string;
  notPublished?: boolean;
  latestCheckFailed: boolean;
  updateAvailable: boolean;
  profileName: string;
  canAutoUpdate: boolean;
  updatedVersion?: string;
  autoReload?: boolean;
  restartDesktop?: boolean;
};

const UPDATE_HEADER = "x-michengai-plugin-update";
const STYLE_ID = "michengai-dsh-codex-pet-update-ui";
const CSS = `
.dcp-update-version{margin-left:8px;color:var(--dsw-alias-label-tertiary,#9da1aa);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;letter-spacing:0;white-space:nowrap;vertical-align:baseline}.dcp-update-check{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:28px;height:28px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2,#4b4d52));border-radius:var(--dsw-radius-sm,7px);background:transparent;color:var(--dsw-alias-label-secondary,#b8bbc2);font:inherit;font-size:12px;font-weight:500;line-height:18px;white-space:nowrap;cursor:pointer}.dcp-update-check:hover{background:var(--dsw-alias-interactive-bg-hover,#3a3b3f);color:var(--dsw-alias-label-primary,#fff)}.dcp-update-icon{display:inline-flex;flex:0 0 auto;width:16px;height:16px;align-items:center;justify-content:center;pointer-events:none}.dcp-update-icon svg{display:block;width:16px;height:16px}
.dcp-update-footer{display:flex;align-items:center;gap:8px}.dcp-update-sheet{display:block;min-width:0}
.dcp-update-content{min-width:0;display:flex;flex-direction:column;gap:0;font-family:inherit;color:var(--dsw-alias-label-primary,#fff)}
.dcp-update-intro{margin:0 0 16px;color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:13px;line-height:20px}.dcp-update-meta{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:8px 18px;margin:0 0 16px;font-size:12px;line-height:18px}.dcp-update-meta dt{color:var(--dsw-alias-label-secondary,#c2c4ca)}.dcp-update-meta dd{margin:0;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.dcp-update-status{margin:0 0 18px;border-radius:var(--dsw-radius-sm,7px);padding:12px 14px;background:var(--dsw-alias-bg-layer-3,var(--dsw-specific-menu-item-hover,#252527));font-size:13px;font-weight:600;line-height:20px}.dcp-update-status[data-kind=error]{color:var(--dsw-alias-state-error-primary,#ff6464)}.dcp-update-status[data-kind=success]{color:var(--dsw-alias-state-success-primary,#36d67a)}.dcp-update-status[data-kind=update]{color:var(--dsw-alias-state-warn-primary,#e8b15a)}.dcp-update-manual{border-top:1px solid var(--dsw-alias-border-l2,#4b4d52);padding-top:16px}.dcp-update-manual h3{margin:0 0 6px;font-size:14px;line-height:20px}.dcp-update-manual p{margin:0 0 10px;color:var(--dsw-alias-label-secondary,#c2c4ca);font-size:12px;line-height:18px}.dcp-update-command{display:flex;align-items:center;gap:8px;border:1px solid var(--dsw-alias-border-l2,#4b4d52);border-radius:var(--dsw-radius-sm,7px);padding:10px;background:var(--dsw-alias-bg-layer-3,var(--dsw-specific-menu-item-hover,#252527))}.dcp-update-command code{min-width:0;flex:1;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:18px;white-space:nowrap}
.dcp-update-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-height:28px;height:28px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2,#4b4d52));border-radius:var(--dsw-radius-sm,7px);padding:0 10px;background:transparent;color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:12px;font-weight:500;line-height:18px;white-space:nowrap;cursor:pointer}.dcp-update-action:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#414247)}.dcp-update-action:disabled{cursor:not-allowed;opacity:.55}.dcp-update-primary{border-color:var(--dsw-alias-button-primary-fill,var(--dsw-alias-state-business-primary,#4f8cff));background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-state-business-primary,#4f8cff));color:var(--dsw-alias-label-primary-foreground,#fff)}.dcp-update-action:focus-visible,.dcp-update-check:focus-visible{outline:var(--dsw-focus-ring-width,1px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4f8cff));outline-offset:2px}
.dcp-update-progress{height:4px;margin-top:10px;overflow:hidden;border-radius:99px;background:var(--dsw-alias-border-l2,#4b4d52)}.dcp-update-progress::after{display:block;width:32%;height:100%;background:var(--dsw-alias-state-business-primary,#4f8cff);content:'';animation:dcp-update-wave 1.15s ease-in-out infinite}@keyframes dcp-update-wave{from{transform:translateX(-110%)}to{transform:translateX(330%)}}@media(max-width:560px){.dcp-update-meta{grid-template-columns:1fr;gap:2px}.dcp-update-meta dd{margin-bottom:6px}}
`;

const ZH = {
  unpublished: "尚未发布到 npm，发布后即可检查并安装更新。",
  check: "检查更新",
  update: "更新",
  close: "关闭",
  recheck: "重新检查",
  auto: "自动更新",
  updating: "正在更新…",
  copy: "复制命令",
  copied: "已复制",
  copyFailed: "复制失败",
  checking: "正在检查更新…",
  latest: "已是最新版本",
  found: "发现新版本",
  failed: "检查更新失败，请稍后重试。",
  current: "运行版本",
  latestLabel: "最新版本",
  profile: "目标 profile",
  unknown: "未知",
  manual: "手工更新",
  manualHint:
    "自动更新失败时，可在当前 DSH 终端执行以下命令，完成后重启 DSH Web。",
  manualHintDesktop:
    "自动更新失败时，请先完全退出 DSH Desktop，再用 Desktop 自带的 dsh 执行以下命令。普通 dsh 会拒绝 desktop profile。",
  intro: "仅检查并更新当前插件，不会联动安装其他插件。",
  restart: "更新完成，请重启 DSH Web。",
  restartDesktop: "更新完成，请完全退出并重新打开 DSH Desktop。",
  restarting: "更新完成，正在重新加载 DSH…",
  unavailable: "当前环境不支持自动更新，请使用手工更新命令。",
};
const EN = {
  unpublished:
    "Not published to npm yet. Updates will be available after publication.",
  check: "Check for updates",
  update: "Update",
  close: "Close",
  recheck: "Check again",
  auto: "Update automatically",
  updating: "Updating…",
  copy: "Copy command",
  copied: "Copied",
  copyFailed: "Copy failed",
  checking: "Checking for updates…",
  latest: "You are up to date",
  found: "New version available",
  failed: "Could not check for updates. Try again later.",
  current: "Running version",
  latestLabel: "Latest version",
  profile: "Target profile",
  unknown: "Unknown",
  manual: "Manual update",
  manualHint:
    "If automatic update fails, run this command in the current DSH terminal, then restart DSH Web.",
  manualHintDesktop:
    "If automatic update fails, fully quit DSH Desktop, then run this command with Desktop's own dsh. A regular dsh rejects the desktop profile.",
  intro:
    "Only this plugin is checked and updated. Other plugins are not changed.",
  restart: "Update complete. Restart DSH Web.",
  restartDesktop: "Update complete. Fully quit and reopen DSH Desktop.",
  restarting: "Update complete. Reloading DSH…",
  unavailable: "Automatic update is unavailable. Use the manual command.",
};

type UpdateStrings = { [Key in keyof typeof ZH]: string };

function strings(language: string): UpdateStrings {
  return /^zh(?:-|$)/i.test(language) ? ZH : EN;
}

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  (document.head ?? document.documentElement).append(style);
}

function validPayload(value: unknown): value is UpdatePayload {
  if (value === null || typeof value !== "object") return false;
  const item = value as Partial<UpdatePayload>;
  return (
    typeof item.packageName === "string" &&
    typeof item.currentVersion === "string" &&
    typeof item.updateAvailable === "boolean" &&
    typeof item.profileName === "string" &&
    typeof item.canAutoUpdate === "boolean" &&
    typeof item.latestCheckFailed === "boolean" &&
    (item.latestVersion === undefined || typeof item.latestVersion === "string")
  );
}

async function requestStatus(
  endpoint: string,
  method: "GET" | "POST",
  signal?: AbortSignal,
  language = "zh",
): Promise<UpdatePayload> {
  const signalOption = signal === undefined ? {} : { signal };
  const response = await fetch(
    endpoint,
    method === "GET"
      ? { cache: "no-store", ...signalOption }
      : {
          method: "POST",
          headers: { "content-type": "application/json", [UPDATE_HEADER]: "1" },
          body: "{}",
          ...signalOption,
        },
  );
  const value = (await response.json()) as UpdatePayload & {
    code?: unknown;
    error?: unknown;
  };
  if (!response.ok || !validPayload(value))
    throw new Error(updateErrorMessage(value.code, language));
  return value;
}

export function manualPluginUpdateCommand(
  profileName: string,
  packageName: string,
  version: string,
): string {
  const profile =
    profileName.trim() === "" ? "" : ` --profile ${profileName.trim()}`;
  return `dsh plugin${profile} add ${packageName}@${version} --registry=https://registry.npmjs.org/`;
}

interface PluginUpdateEscapeEvent {
  readonly key: string;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

export function handlePluginUpdateEscape(
  event: PluginUpdateEscapeEvent,
  close: () => void,
): boolean {
  if (event.key !== "Escape") return false;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  close();
  return true;
}

export function observePluginUpdate(
  options: PluginUpdateUiOptions,
): () => void {
  if (typeof document === "undefined" || document.body === null)
    return () => {};
  ensureStyle();
  const controller = new AbortController();
  let payload: UpdatePayload | undefined;
  let mount: { host: HTMLDivElement; root: Root } | undefined;
  let frame: number | undefined;

  const setButtonContent = (
    button: HTMLButtonElement,
    label: string,
    iconName: PluginUpdateIconName,
  ): void => {
    const icon = options.createIcon(iconName);
    icon.classList.add("dcp-update-icon");
    icon.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.dataset.mpiLabel = "";
    text.textContent = label;
    button.replaceChildren(icon, text);
  };
  const setButtonLabel = (button: HTMLButtonElement, label: string): void => {
    const text = button.querySelector<HTMLElement>("[data-mpi-label]");
    if (text === null) button.textContent = label;
    else text.textContent = label;
  };

  const applyControls = (): void => {
    const row =
      options.root ??
      document.querySelector<HTMLElement>(options.titleRowSelector);
    if (row === null) return;
    const links = row.querySelector<HTMLElement>(options.linksSelector);
    if (
      links === null ||
      links.querySelector(`[data-mpi-check="${options.packageName}"]`) !== null
    )
      return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dcp-update-check";
    button.dataset.mpiCheck = options.packageName;
    setButtonContent(button, strings(options.language).check, "refresh");
    button.addEventListener("click", openDialog);
    links.append(button);
  };

  const load = async (): Promise<UpdatePayload> => {
    payload = await requestStatus(
      options.endpoint,
      "GET",
      controller.signal,
      options.language,
    );
    applyControls();
    return payload;
  };

  const closeDialog = (): void => {
    if (mount === undefined) return;
    const { host, root } = mount;
    mount = undefined;
    root.unmount();
    host.remove();
  };

  function openDialog(): void {
    closeDialog();
    const text = strings(options.language);
    const dialog = document.createElement("section");
    dialog.className = "dcp-update-sheet";
    // 标题、关闭按钮与底部动作行都交给宿主 Modal（与技能管理等插件同一套外观）；
    // 这里只放正文。
    dialog.innerHTML = `<p class="dcp-update-intro"></p><dl class="dcp-update-meta"><dt></dt><dd data-role="current"></dd><dt></dt><dd data-role="latest"></dd><dt></dt><dd data-role="profile"></dd></dl><div class="dcp-update-status" role="status"></div><div class="dcp-update-progress" hidden></div><section class="dcp-update-manual"><h3></h3><p></p><div class="dcp-update-command"><code></code><button type="button" class="dcp-update-action" data-action="copy"></button></div></section>`;
    const name = /^zh(?:-|$)/i.test(options.language)
      ? options.zhName
      : options.enName;
    dialog.querySelector<HTMLElement>(".dcp-update-intro")!.textContent = text.intro;
    const terms = dialog.querySelectorAll("dt");
    terms[0]!.textContent = text.current;
    terms[1]!.textContent = text.latestLabel;
    terms[2]!.textContent = text.profile;
    dialog.querySelector<HTMLElement>(".dcp-update-manual h3")!.textContent =
      text.manual;
    dialog.querySelector<HTMLElement>(".dcp-update-manual p")!.textContent =
      payload?.profileName === "desktop" ? text.manualHintDesktop : text.manualHint;
    const status = dialog.querySelector<HTMLElement>(".dcp-update-status")!;
    const progress = dialog.querySelector<HTMLElement>(".dcp-update-progress")!;
    const command = dialog.querySelector<HTMLElement>(".dcp-update-command code")!;
    const check = document.createElement("button");
    check.type = "button";
    check.className = "dcp-update-action";
    check.dataset.action = "check";
    check.dataset.modalAutofocus = "true";
    const update = document.createElement("button");
    update.type = "button";
    update.className = "dcp-update-action dcp-update-primary";
    update.dataset.action = "update";
    const copy = dialog.querySelector<HTMLButtonElement>("[data-action=copy]")!;
    setButtonContent(check, text.recheck, "refresh");
    setButtonContent(update, text.auto, "download");
    setButtonContent(copy, text.copy, "copy");
    let busy = false;
    const setMessage = (message: string, kind = ""): void => {
      status.textContent = message;
      status.dataset.kind = kind;
      status.style.color = kind === "update" ? "var(--dsw-alias-state-warn-primary,#e8b15a)" : "";
    };
    const setBusy = (value: boolean): void => {
      busy = value;
      check.disabled = value;
      copy.disabled = value;
      update.disabled =
        value ||
        payload?.canAutoUpdate !== true ||
        payload.updateAvailable !== true;
      progress.hidden = !value;
    };
    const render = (): void => {
      dialog.querySelector<HTMLElement>("[data-role=current]")!.textContent =
        payload === undefined ? text.unknown : `v${payload.currentVersion}`;
      dialog.querySelector<HTMLElement>("[data-role=latest]")!.textContent =
        payload?.latestVersion === undefined
          ? text.unknown
          : `v${payload.latestVersion}`;
      dialog.querySelector<HTMLElement>("[data-role=profile]")!.textContent =
        payload?.profileName ?? text.unknown;
      const hint = dialog.querySelector<HTMLElement>(".dcp-update-manual p");
      if (hint !== null)
        hint.textContent =
          payload?.profileName === "desktop"
            ? text.manualHintDesktop
            : text.manualHint;
      command.textContent = manualPluginUpdateCommand(
        payload?.profileName ?? "",
        options.packageName,
        payload?.latestVersion ?? "latest",
      );
      update.disabled =
        busy ||
        payload?.canAutoUpdate !== true ||
        payload.updateAvailable !== true;
      if (payload === undefined) setMessage(text.checking);
      else if (payload.notPublished) setMessage(text.unpublished);
      else if (payload.latestCheckFailed) setMessage(text.failed, "error");
      else if (payload.updateAvailable)
        setMessage(`${text.found}: v${payload.latestVersion ?? text.unknown}`, "update");
      else setMessage(text.latest, "success");
      if (
        payload !== undefined &&
        !payload.canAutoUpdate &&
        payload.updateAvailable
      )
        setMessage(text.unavailable, "update");
    };
    const checkNow = async (): Promise<void> => {
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
          "error",
        );
      }
    };
    const updateNow = async (): Promise<void> => {
      if (busy) return;
      setBusy(true);
      setButtonLabel(update, text.updating);
      setMessage(text.updating);
      try {
        payload = await requestStatus(
          options.endpoint,
          "POST",
          controller.signal,
          options.language,
        );
        if (payload.updatedVersion) payload.updateAvailable = false;
        applyControls();
        render();
        setMessage(
          payload.autoReload === true
            ? text.restarting
            : payload.profileName === "desktop" || payload.restartDesktop === true
              ? text.restartDesktop
              : text.restart,
          "success",
        );
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : text.failed,
          "error",
        );
      } finally {
        setButtonLabel(update, text.auto);
        setBusy(false);
      }
    };
    check.addEventListener("click", () => {
      void checkNow();
    });
    update.addEventListener("click", () => {
      void updateNow();
    });
    copy.addEventListener("click", () => {
      void navigator.clipboard
        ?.writeText(command.textContent ?? "")
        .then(() => {
          setButtonLabel(copy, text.copied);
          setTimeout(() => {
            setButtonLabel(copy, text.copy);
          }, 1_400);
        })
        .catch(() => {
          setButtonLabel(copy, text.copyFailed);
        });
    });
    const host = document.createElement("div");
    host.className = "dcp-update-host";
    document.body.append(host);
    host.addEventListener(
      "keydown",
      (event) => {
        handlePluginUpdateEscape(event, closeDialog);
      },
      true,
    );
    const root = createRoot(host);
    mount = { host, root };
    root.render(
      React.createElement(Modal, {
        open: true,
        className: "dcp-update-dialog",
        title: `${name} ${text.update}`,
        closeLabel: text.close,
        onClose: closeDialog,
        footer: React.createElement("div", {
          className: "dcp-update-footer",
          ref: (node: HTMLDivElement | null): void => {
            if (node !== null && check.parentElement !== node) node.append(check, update);
          },
        }),
        children: React.createElement("div", {
          className: "dcp-update-content",
          ref: (node: HTMLDivElement | null): void => {
            if (node !== null && !node.contains(dialog)) node.append(dialog);
          },
        }),
      }),
    );
    render();
    void checkNow();
  }

  const observer = new MutationObserver(() => {
    if (frame !== undefined) return;
    frame = window.requestAnimationFrame(() => {
      frame = undefined;
      applyControls();
    });
  });
  observer.observe(options.root ?? document.body, {
    childList: true,
    subtree: true,
  });
  applyControls();
  void load().catch(() => {});
  return () => {
    controller.abort();
    observer.disconnect();
    closeDialog();
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    (options.root ?? document)
      .querySelectorAll(
        `[data-mpi-check="${options.packageName}"],.dcp-update-version[data-package="${options.packageName}"]`,
      )
      .forEach((node) => node.remove());
  };
}
