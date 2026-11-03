import { compatibleSessions, type CompatibleSessions } from "./session-compat.ts";
import { pendingFromSessionStatus } from "./pending-status.ts";
import { createCompanionProvider } from "./companion-api.ts";
import { translator } from "./ui-locales.ts";
import type { PetLocaleStore } from "./pet-locales.ts";
/** 只通过 DSH 公共插槽与 Session 快照接入，独立于其他宠物插件。 */
import React, { useEffect, useState, useRef } from "react";
import { Button, Modal } from "@deepseek-ai/dsh-client-ui-primitives";
import { Companion, Settings, usePetController } from "./ui.tsx";
import { IDLE, type Activity } from "./model.ts";
import { type Sessions, type PendingStore, type Store, type SessionStatusRow } from "./activity.ts";
import type { ISessions, SessionTarget } from "@deepseek-ai/dsh-api-session-controller/client";
import type { UiWorkspace } from "@deepseek-ai/dsh-client-ui-workspace/client";
import type { UiSession } from "@deepseek-ai/dsh-client-ui-session/client";
import {
  createNotifications,
  type DismissedNotice,
  type NotificationState,
} from "./notifications.ts";
import type { TrayCommand } from "./notification-tray.tsx";
import { createPetSession, type CreationSessions } from "./creation.ts";
import { PetNavIcon, observePetSettingsIcon } from "./settings-icon.ts";
import { GlobalOverlay } from "./global-overlay.tsx";
interface ClientContext {
  locale: PetLocaleStore;
  sessions: ISessions;
  uiSession?: UiSession;
  uiWorkspace?: Pick<UiWorkspace, "openSession">;
  reflect?: { get(name: string): unknown };
  slots: {
    inject(name: string, register: () => () => void): void;
    register(
      options: {
        name: string;
        id: string;
        order?: number;
        label?: string | (() => string);
      },
      component: () => React.ReactElement,
    ): () => void;
  };
}
export const name = "michengai-codex-pet";
export const inject = ["slots", "sessions", "locale"];
/** 没有宠物时的空通知快照；引用稳定，避免收起宠物时反复触发渲染。 */
const EMPTY_NOTIFICATIONS: NotificationState = {
  items: [],
  activity: IDLE,
  hidden: 0,
};
function openSettings(): void {
  const trigger = document.querySelector("[data-dcu-settings-trigger]");
  if (trigger)
    trigger.dispatchEvent(
      new CustomEvent("dcu-settings-open-section", {
        bubbles: true,
        cancelable: true,
        detail: { labels: ["宠物", "Pets"] },
      }),
    );
  else window.dispatchEvent(new Event("dcp-open-settings"));
}
function Overlay({
  sessions,
  pending,
  locale,
}: {
  sessions: CompatibleSessions;
  pending: PendingStore;
  locale: PetLocaleStore;
}) {
  const controller = usePetController(locale);
  const t = translator(controller.language);
  // 设置面板用宿主 Modal：原生 <dialog showModal> 会进入顶层图层，
  // 把它内部打开的更新弹窗（同样基于 Modal，挂在 body）压在下面看不见。
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const show = () => setSettingsOpen(true);
    window.addEventListener("dcp-open-settings", show);
    return () => window.removeEventListener("dcp-open-settings", show);
  }, []);
  const [state, setState] = useState<NotificationState>(EMPTY_NOTIFICATIONS);
  const notifications = useRef<ReturnType<typeof createNotifications> | null>(
    null,
  );
  // 已关闭的通知记录要跨引擎实例保留：收起再展开时不该重新弹出。
  const dismissed = useRef(new Map<string, DismissedNotice>());
  // 设置面板关闭即卸载，创建宠物时输入的描述要跨开关保留。
  const createDraft = useRef("");
  // 没有宠物在屏幕上就不跑通知引擎：引擎会 retain（打开）会话列表里的每个会话，
  // 并每秒遍历一次全量会话。宠物未加载或已收起时这笔开销必须为零。
  const petVisible = controller.library?.config.visible === true;
  useEffect(() => {
    if (!petVisible) {
      setState((current) =>
        current.items.length === 0 &&
        current.activity.pose === "idle" &&
        current.hidden === 0
          ? current
          : EMPTY_NOTIFICATIONS,
      );
      return;
    }
    const engine = createNotifications(
      sessions,
      pending,
      setState,
      Date.now,
      dismissed.current,
    );
    notifications.current = engine;
    return () => {
      notifications.current = null;
      engine.dispose();
      // 收起宠物后立刻释放引擎打开的会话，避免历史与订阅常驻内存。
      sessions.releaseBindings();
    };
  }, [sessions, pending, petVisible]);
  useEffect(observePetSettingsIcon, []);
  const command = async (value: TrayCommand) => {
    const engine = notifications.current;
    if (!engine) throw new Error("会话服务尚未就绪");
    if (value.type === "sort") {
      engine.sort(value.latest);
      return;
    }
    await engine.command(value);
  };
  const [externalDisplay, setExternalDisplay] = useState(false);
  const actions = useRef({
    command,
    updateConfig: controller.update,
    openSettings,
  });
  actions.current = { command, updateConfig: controller.update, openSettings };
  const provider = useRef<ReturnType<typeof createCompanionProvider> | null>(
    null,
  );
  useEffect(() => {
    const value = createCompanionProvider({
      command: (command) => actions.current.command(command),
      updateConfig: (config) => actions.current.updateConfig(config),
      openSettings: () => actions.current.openSettings(),
      externalDisplay: setExternalDisplay,
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
  useEffect(() => {
    const library = controller.library;
    provider.current?.publish(
      library
        ? {
            pet:
              library.pets.find((pet) => pet.id === library.config.selected) ??
              null,
            config: library.config,
            language: controller.language,
            notifications: state,
          }
        : null,
    );
  }, [controller.library, controller.language, state]);
  return (
    <>
      {!externalDisplay && (
        <Companion
          controller={controller}
          activity={state.activity}
          tray={{ state, command }}
          open={() => {
            if (state.activity.sessionId) sessions.open?.(state.activity.sessionId);
          }}
          settings={openSettings}
        />
      )}
      {settingsOpen && (
        <Modal
          open
          headless
          className="dcp dcp-settings-modal"
          title={t("宠物设置")}
          onClose={() => setSettingsOpen(false)}
        >
          <div className="dcp-settings-modal-body">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="dcp-dialog-close"
              onClick={() => setSettingsOpen(false)}
            >
              {t("关闭设置")}
            </Button>
            <Settings
              draft={createDraft}
              controller={controller}
              locale={locale}
              create={async (description) => {
                const library = controller.library;
                if (!library) throw new Error("宠物库尚未加载");
                await createPetSession(
                  sessions as CreationSessions,
                  description,
                  library.customPath,
                  library.skillPath,
                );
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
function Page({
  sessions,
  locale,
}: {
  sessions: Sessions;
  locale: PetLocaleStore;
}) {
  const controller = usePetController(locale);
  return (
    <Settings
      controller={controller}
      locale={locale}
      create={async (description) => {
        const library = controller.library;
        if (!library) throw new Error("宠物库尚未加载");
        await createPetSession(
          sessions as CreationSessions,
          description,
          library.customPath,
          library.skillPath,
        );
      }}
    />
  );
}
function probe<T>(ctx: ClientContext, name: "uiSession" | "uiWorkspace"): T | undefined {
  // Cordis 未注入的服务不能直接读 ctx.uiWorkspace，否则插件无法激活。
  if (ctx.reflect) {
    try { return ctx.reflect.get(name) as T | undefined; } catch { return undefined; }
  }
  return ctx[name] as T | undefined;
}
function liveSessionStatus(ctx: ClientContext): Store<ReadonlyMap<string, SessionStatusRow>> {
  const resolve = () => {
    const live = probe<UiSession>(ctx, "uiSession");
    return live?.sessionStatus;
  };
  return {
    getSnapshot() { return resolve()?.getSnapshot() ?? new Map(); },
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
      return () => { clearInterval(timer); off?.(); };
    },
  };
}
export function apply(ctx: ClientContext): void {
  const status = liveSessionStatus(ctx);
  const sessions = compatibleSessions(
    ctx.sessions as unknown as Sessions,
    id => {
      const uiWorkspace = probe<Pick<UiWorkspace, "openSession">>(ctx, "uiWorkspace");
      if (uiWorkspace) return uiWorkspace.openSession(id as SessionTarget);
    },
    status,
  );
  // 服务可能晚于插件激活；reflect.get 未注入时不能直接读，否则插件无法激活。
  const pending = pendingFromSessionStatus(status);
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      {
        name: "settings.section",
        id: "codex-pet",
        label: () => translator(ctx.locale.getSnapshot().active)("宠物"),
        order: 50,
      },
      () => <Page sessions={sessions} locale={ctx.locale} />,
    ),
  );
  (ctx.slots.inject as any)("settings.section.icon", () =>
    (ctx.slots.register as any)(
      {
        name: "settings.section.icon",
        id: "codex-pet",
      },
      PetNavIcon,
    ),
  );
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      { name: "shell.overlay", id: "michengai-codex-pet", order: 100 },
      () => (
        <GlobalOverlay>
          <Overlay
            sessions={sessions}
            pending={pending}
            locale={ctx.locale}
          />
        </GlobalOverlay>
      ),
    ),
  );
}
