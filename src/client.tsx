import { compatibleSessions } from "./session-compat.ts";
import { compatiblePending } from "./legacy-pending.ts";
import { createCompanionProvider } from "./companion-api.ts";
import { translator } from "./ui-locales.ts";
import type { PetLocaleStore } from "./pet-locales.ts";
/** 只通过 DSH 公共插槽与 Session 快照接入，独立于其他宠物插件。 */
import React, { useEffect, useState, useRef } from "react";
import { Companion, Settings, usePetController } from "./ui.tsx";
import { IDLE, type Activity } from "./model.ts";
import { type Sessions, type PendingStore } from "./activity.ts";
import {
  createNotifications,
  type NotificationState,
} from "./notifications.ts";
import type { TrayCommand } from "./notification-tray.tsx";
import { createPetSession, type CreationSessions } from "./creation.ts";
import { observePetSettingsIcon } from "./settings-icon.ts";
interface ClientContext {
  locale: PetLocaleStore;
  sessions: Sessions & CreationSessions;
  uiSession?: { pendingInteractions: PendingStore };
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
  sessions: Sessions & CreationSessions;
  pending: PendingStore;
  locale: PetLocaleStore;
}) {
  const controller = usePetController(locale);
  const t = translator(controller.language);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const show = () => {
      if (!settingsDialog.current?.open) settingsDialog.current?.showModal();
    };
    window.addEventListener("dcp-open-settings", show);
    return () => window.removeEventListener("dcp-open-settings", show);
  }, []);
  const [state, setState] = useState<NotificationState>({
    items: [],
    activity: IDLE,
    hidden: 0,
  });
  const notifications = useRef<ReturnType<typeof createNotifications> | null>(
    null,
  );
  useEffect(() => {
    const engine = createNotifications(sessions, pending, setState);
    notifications.current = engine;
    return () => {
      notifications.current = null;
      engine.dispose();
    };
  }, [sessions, pending]);
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
            if (state.activity.sessionId)
              sessions.open(state.activity.sessionId);
          }}
          settings={openSettings}
        />
      )}
      <dialog
        ref={settingsDialog}
        className="dcp dcp-dialog"
        aria-label={t("宠物设置")}
        style={{
          width: "min(800px, calc(100vw - 32px))",
          maxHeight: "85vh",
          overflow: "auto",
        }}
      >
        <button
          type="button"
          className="dcp-button"
          onClick={() => settingsDialog.current?.close()}
        >
          {t("关闭设置")}
        </button>
        <Settings
          controller={controller}
          locale={locale}
          create={async (description) => {
            const library = controller.library;
            if (!library) throw new Error("宠物库尚未加载");
            await createPetSession(
              sessions,
              description,
              library.customPath,
              library.skillPath,
            );
          }}
        />
      </dialog>
    </>
  );
}
function Page({
  sessions,
  locale,
}: {
  sessions: CreationSessions;
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
          sessions,
          description,
          library.customPath,
          library.skillPath,
        );
      }}
    />
  );
}
export function apply(ctx: ClientContext): void {
  const sessions = compatibleSessions(ctx.sessions);
  // Cordis 的 reflect.get 允许探测旧版不存在的服务，不声明不存在的必需依赖。
  const pending = compatiblePending(sessions, () => {
    const service = (ctx.reflect ? ctx.reflect.get("uiSession") : ctx.uiSession) as { pendingInteractions: PendingStore } | undefined;
    return service?.pendingInteractions;
  });
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      {
        name: "settings.section",
        id: "codex-pet",
        label: () => translator(ctx.locale.getSnapshot().active)("宠物"),
        order: 12,
      },
      () => <Page sessions={sessions} locale={ctx.locale} />,
    ),
  );
  ctx.slots.inject("shell.overlay", () =>
    ctx.slots.register(
      { name: "shell.overlay", id: "michengai-codex-pet", order: 100 },
      () => (
        <Overlay
          sessions={sessions}
          pending={pending}
          locale={ctx.locale}
        />
      ),
    ),
  );
}
