import { createLibraryStore } from "./library-store.ts";
import { translator } from "./ui-locales.ts";
import { PluginUpdateHeader } from "./plugin-update-ui.tsx";
import { localizePet, type PetLocaleStore } from "./pet-locales.ts";
import {
  NotificationTray,
  trayStyles,
  polishedTrayStyles,
  type TrayProps,
} from "./notification-tray.tsx";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useMemo,
} from "react";
import { ReloadIcon, ArrowTopRightIcon } from "@radix-ui/react-icons";
import {
  ANIMATIONS,
  BASE,
  IDLE,
  lookCell,
  type Activity,
  type Config,
  type Library,
  type Pet,
  type Pose,
} from "./model.ts";
import { styles } from "./styles.ts";
export async function request(path: string, data?: unknown): Promise<Library> {
  const response = await fetch(`${BASE}/api/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers:
      data === undefined
        ? undefined
        : { "content-type": "application/json", "x-dsh-pet": "1" },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "宠物服务暂不可用");
  return result as Library;
}
export interface PetController {
  library: Library | null;
  language: string;
  error: string;
  update(value: Partial<Config>): Promise<void>;
  refresh(): Promise<void>;
  folder(): Promise<void>;
}
const libraryStore = createLibraryStore(request);
/** 设置页与浮窗共享后端状态，显示文案跟随当前语言。 */
export function usePetController(locale?: PetLocaleStore): PetController {
  const language = useSyncExternalStore(
    (listener) => (locale ? locale.subscribe(listener) : () => {}),
    () => locale?.getSnapshot().active ?? "zh",
  );
  const { library, error } = useSyncExternalStore(
    libraryStore.subscribe,
    libraryStore.getSnapshot,
  );
  const localizedLibrary = useMemo(
    () =>
      library
        ? {
            ...library,
            pets: library.pets.map((pet) => localizePet(pet, language)),
          }
        : null,
    [library, language],
  );
  return {
    library: localizedLibrary,
    language,
    error,
    update: (value) => libraryStore.run("config", value),
    refresh: () => libraryStore.run("refresh", {}),
    folder: () => libraryStore.run("open-folder", {}),
  };
}
export function Sprite({
  pet,
  size,
  pose = "idle",
  animate = false,
  look = null,
}: {
  pet: Pet;
  size: number;
  pose?: Pose;
  animate?: boolean;
  look?: { row: number; col: number } | null;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const animation = ANIMATIONS[pose];
    let frame = 0,
      last: number | null = null,
      id = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paint = () => {
      const row = pet.version === 2 && look ? look.row : animation.row;
      const col = pet.version === 2 && look ? look.col : frame;
      node.style.backgroundPosition = `${-col * size}px ${(-row * size * 208) / 192}px`;
    };
    paint();
    const tick = (time: number) => {
      if (last === null || document.hidden) last = time;
      if (!document.hidden && time - last >= animation.durations[frame]!) {
        last = time;
        frame = (frame + 1) % animation.durations.length;
        paint();
      }
      id = requestAnimationFrame(tick);
    };
    if (animate && !look && !reduced.matches) id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [pet.id, pet.version, size, pose, animate, look]);
  return (
    <div
      ref={element}
      className="dcp-sprite"
      style={{
        width: size,
        height: (size * 208) / 192,
        backgroundImage: `url("${pet.url}")`,
        backgroundSize: `${size * 8}px ${((size * 208) / 192) * (pet.version === 2 ? 11 : 9)}px`,
      }}
    />
  );
}
export function Settings({
  controller,
  create,
  locale,
}: {
  locale?: PetLocaleStore;
  controller: PetController;
  create?(description: string): Promise<void>;
}) {
  const t = translator(controller.language);
  const { library, error } = controller;
  const [busy, setBusy] = useState(false),
    [showCreate, setShowCreate] = useState(false),
    [description, setDescription] = useState("");
  const [size, setSize] = useState(library?.config.size ?? 120);
  const dialog = useRef<HTMLDialogElement>(null);
  const [creationError, setCreationError] = useState("");
  useEffect(() => {
    if (library) setSize(library.config.size);
  }, [library?.config.size]);
  useEffect(() => {
    if (showCreate) dialog.current?.showModal();
    else dialog.current?.close();
  }, [showCreate]);
  const act = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      /* 错误由控制器统一展示。 */
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="dcp dcp-page">
      <style>{styles}</style>
      <PluginUpdateHeader locale={locale} />
      <header className="dcp-head">
        <div>
          <h2>{t("选择宠物")}</h2>
          <p className="dcp-sub">
            {t("宠物会管理对话串，并突出显示需要关注的事项")}
          </p>
        </div>
        <div className="dcp-actions">
          <button
            className="dcp-icon"
            title={t("刷新宠物库")}
            aria-label={t("刷新宠物库")}
            disabled={busy}
            onClick={() => void act(controller.refresh)}
          >
            <ReloadIcon />
          </button>
          <button
            className="dcp-button"
            disabled={!library || busy}
            onClick={() => setShowCreate(true)}
          >
            {t("创建")}
          </button>
          <button
            className="dcp-button"
            disabled={!library || busy}
            onClick={() =>
              void act(() =>
                controller.update({ visible: !library?.config.visible }),
              )
            }
          >
            {library?.config.visible === false ? t("显示宠物") : t("收起宠物")}
          </button>
        </div>
      </header>
      {error && (
        <div role="alert" className="dcp-error">
          {t(error)}
        </div>
      )}
      <div className="dcp-card">
        {!library && (
          <div className="dcp-empty" role="status">
            {t("正在加载宠物…")}
          </div>
        )}
        {library?.pets.map((pet) => (
          <div className="dcp-row" key={pet.id}>
            <div className="dcp-preview">
              <Sprite pet={pet} size={44} />
            </div>
            <div className="dcp-info">
              <div className="dcp-name">{pet.name}</div>
              <div className="dcp-description">{pet.description}</div>
            </div>
            <button
              className="dcp-button"
              aria-label={
                library.config.selected === pet.id
                  ? `${t("已选择")} ${pet.name}`
                  : `${t("选择")} ${pet.name}`
              }
              aria-pressed={library.config.selected === pet.id}
              disabled={busy || library.config.selected === pet.id}
              onClick={() =>
                void act(() => controller.update({ selected: pet.id }))
              }
            >
              {library.config.selected === pet.id ? t("已选") : t("选择")}
            </button>
          </div>
        ))}
        {library?.pets.length === 0 && (
          <div className="dcp-empty">
            {t("尚未加载宠物。内置资源缺失，请重新安装完整插件。")}
          </div>
        )}
        <div className="dcp-folder">
          <div>
            <div>{t("DSH 自定义宠物")}</div>
            <div className="dcp-path">
              {library?.customPath ?? t("正在读取目录…")}
            </div>
          </div>
          <button
            className="dcp-folder-button"
            disabled={!library || busy}
            onClick={() => void act(controller.folder)}
          >
            {t("打开文件夹")} <ArrowTopRightIcon />
          </button>
        </div>
      </div>
      {!!library?.warnings.length && (
        <details className="dcp-note">
          <summary>
            {t("有 {count} 项宠物资源需要检查", {
              count: library.warnings.length,
            })}
          </summary>
          {library.warnings.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </details>
      )}
      <section className="dcp-appearance">
        <h2>{t("外观")}</h2>
        <div className="dcp-card dcp-size">
          <label htmlFor="dcp-size">
            {t("宠物大小")}
            <small>{t("调整宠物大小")}</small>
          </label>
          <input
            id="dcp-size"
            aria-label={t("宠物大小")}
            type="range"
            min="64"
            max="224"
            step="4"
            value={size}
            disabled={!library || busy}
            onChange={(event) => setSize(Number(event.target.value))}
            onPointerUp={() => void act(() => controller.update({ size }))}
            onKeyUp={() => void act(() => controller.update({ size }))}
          />
        </div>
      </section>
      {library?.creation && (
        <div className="dcp-note dcp-creation" role="status">
          {library.creation.message}
        </div>
      )}
      <dialog
        ref={dialog}
        className="dcp-dialog"
        onCancel={() => setShowCreate(false)}
        onClose={() => setShowCreate(false)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!create) return;
            setBusy(true);
            setCreationError("");
            void create(description)
              .then(() => {
                setShowCreate(false);
                setDescription("");
              })
              .catch((error) =>
                setCreationError(
                  error instanceof Error ? error.message : t("创建失败"),
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          <h2>{t("创建宠物")}</h2>
          <textarea
            autoFocus
            aria-label={t("宠物描述")}
            placeholder={t(
              "例如：一只戴着圆眼镜的小海獭，安静、好奇，毛绒玩具风格…",
            )}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
          <p className="dcp-note">
            {t(
              "在 DSH 新会话中使用随插件提供的 Skill 创建，成品保存到 DSH 宠物目录。需要当前会话具备图像生成工具。",
            )}
          </p>
          {!create && (
            <p role="status">
              {t(
                "请在 DSH 主界面的宠物设置中发起创建；独立预览不提供会话服务。",
              )}
            </p>
          )}
          {creationError && (
            <p role="alert" className="dcp-error">
              {t(creationError)}
            </p>
          )}
          <footer>
            <button
              type="button"
              className="dcp-button"
              onClick={() => setShowCreate(false)}
            >
              {t("取消")}
            </button>
            <button
              type="submit"
              className="dcp-button dcp-primary"
              disabled={
                busy ||
                !description.trim() ||
                !library?.skillAvailable ||
                !create
              }
            >
              {t("在 DSH 中创建")}
            </button>
          </footer>
        </form>
      </dialog>
    </div>
  );
}
export function FloatingPet({
  pet,
  config,
  activity,
  update,
  open,
  settings,
  tray,
}: {
  pet: Pet;
  config: Config;
  activity: Activity;
  update(value: Partial<Config>): Promise<void>;
  open(): void;
  settings(): void;
  tray?: TrayProps;
}) {
  const t = translator(pet.displayLocale ?? "zh");
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 }),
    [action, setAction] = useState<Pose | null>(null),
    [look, setLook] = useState<{ row: number; col: number } | null>(null),
    [menu, setMenu] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuError, setMenuError] = useState("");
  const petHeight = (config.size * 208) / 192;
  const place = useCallback(() => {
    const width = Math.max(0, innerWidth - config.size - 16),
      height = Math.max(0, innerHeight - petHeight - 32);
    setPosition({ left: config.position ? config.position.x * width : width, top: config.position ? config.position.y * height : height });
  }, [config.size, config.position, petHeight]);
  useEffect(() => {
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [place]);
  const perform = useCallback((pose: Pose) => {
    if (timer.current) clearTimeout(timer.current);
    setLook(null);
    setAction(pose);
    const anim = ANIMATIONS[pose];
    timer.current = setTimeout(
      () => setAction(null),
      anim.durations.reduce((sum, value) => sum + value, 0),
    );
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        activity.pose === "idle" &&
        !action &&
        !drag.current &&
        !document.hidden &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        perform(Math.random() < 0.7 ? "waving" : "jumping");
    }, 18000);
    return () => clearInterval(interval);
  }, [activity.pose, action, perform]);
  useEffect(() => {
    const track = (event: MouseEvent) => {
      if (
        activity.pose !== "idle" ||
        action ||
        drag.current ||
        pet.version !== 2
      ) {
        setLook(null);
        return;
      }
      const box = root.current?.getBoundingClientRect();
      if (box)
        setLook(
          lookCell(
            event.clientX - box.left - config.size / 2,
            event.clientY - box.top - petHeight / 2,
          ),
        );
    };
    window.addEventListener("mousemove", track);
    return () => window.removeEventListener("mousemove", track);
  }, [activity.pose, action, pet.version, config.size, petHeight]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);
  const persistPosition = () =>
    update({
      position: {
        x: position.left / Math.max(1, innerWidth - config.size - 16),
        y: position.top / Math.max(1, innerHeight - petHeight - 32),
      },
    }).catch(() => {});
  return (
    <div
      className="dcp dcp-floating"
      ref={root}
      style={{
        left: position.left,
        top: position.top,
        width: config.size,
        height: petHeight,
      }}
    >
      <style>{styles}</style>
      {tray && !menu && (
        <div
          style={{
            ["--tray-height" as string]: `${Math.max(100, Math.min(420, position.top < innerHeight / 2 ? innerHeight - position.top - petHeight - 44 : position.top - 24))}px`,
            ["--tray-top" as string]:
              position.top < innerHeight / 2 ? "calc(100% + 28px)" : "auto",
            ["--tray-bottom" as string]:
              position.top < innerHeight / 2 ? "auto" : "calc(100% + 12px)",
            ["--tray-right" as string]:
              position.left < 296 - config.size ? "auto" : "0",
            ["--tray-left" as string]:
              position.left < 296 - config.size ? "0" : "auto",
          }}
        >
          <style>{trayStyles + polishedTrayStyles}</style>
          <NotificationTray {...tray} language={pet.displayLocale} />
        </div>
      )}
      {!tray && activity.text && !menu && (
        <button
          className="dcp-bubble"
          style={{
            ...(position.top < 84
              ? { top: "calc(100% + 28px)", bottom: "auto" }
              : {}),
            ...(position.left < 240
              ? { left: 0, right: "auto" }
              : {}),
          }}
          onClick={open}
          title={t("打开关联任务")}
        >
          <strong>{activity.title}</strong>
          <span>{t(activity.text)}</span>
        </button>
      )}
      <button
        className="dcp-pet-button"
        aria-label={t("{name}，{status}；拖动移动，双击跳跃，右键菜单", {
          name: pet.name,
          status: t(activity.text || "空闲"),
        })}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenu((value) => !value);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = {
            x: event.screenX,
            y: event.screenY,
            startX: event.screenX,
            startY: event.screenY,
            left: position.left,
            top: position.top,
            moved: false,
          };
          setMenu(false);
        }}
        onPointerMove={(event) => {
          const point = drag.current;
          if (!point) return;
          const dx = event.screenX - point.x,
            dy = event.screenY - point.y;
          if (
            Math.hypot(
              event.screenX - point.startX,
              event.screenY - point.startY,
            ) > 4
          )
            point.moved = true;
          if (!point.moved) return;
          setLook(null);
          setAction(dx < 0 ? "running-left" : "running-right");
            setPosition({
              left: Math.max(
                0,
                Math.min(
                  innerWidth - config.size - 16,
                  point.left + event.screenX - point.startX,
                ),
              ),
              top: Math.max(
                0,
                Math.min(
                  innerHeight - petHeight - 32,
                  point.top + event.screenY - point.startY,
                ),
              ),
            });
          point.x = event.screenX;
          point.y = event.screenY;
        }}
        onPointerUp={() => {
          const point = drag.current;
          drag.current = null;
          setAction(null);
          if (point?.moved) void persistPosition();
          else if (!point?.moved) perform("waving");
        }}
        onPointerCancel={() => {
          drag.current = null;
          setAction(null);
        }}
        onDoubleClick={() => perform("jumping")}
        onPointerEnter={() => {
          if (activity.pose === "idle" && !action && !drag.current)
            perform("waving");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenu(false);
          if (
            event.key === "ContextMenu" ||
            (event.shiftKey && event.key === "F10")
          ) {
            event.preventDefault();
            setMenu(true);
          }
          if (event.key === "Enter") perform("waving");
        }}
      >
        <Sprite
          pet={pet}
          size={config.size}
          pose={action ?? activity.pose}
          animate
          look={look}
        />
      </button>
      {menu && (
        <div
          className="dcp-menu"
          style={{
            ...(position.top < 220
              ? { top: "calc(100% + 28px)", bottom: "auto" }
              : {}),
            ...(position.left < 160
              ? { left: 0, right: "auto" }
              : {}),
          }}
          role="menu"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenu(false);
          }}
        >
          <button
            role="menuitem"
            onClick={() => {
              perform("waving");
              setMenu(false);
            }}
          >
            {t("打个招呼")}
          </button>
          <button
            role="menuitem"
            onClick={() => {
              perform("jumping");
              setMenu(false);
            }}
          >
            {t("跳一跳")}
          </button>
          {!!tray?.state.hidden && (
            <button
              role="menuitem"
              onClick={() => {
                setMenuError("");
                void tray
                  .command({ type: "restore" })
                  .then(() => setMenu(false))
                  .catch((error) =>
                    setMenuError(
                      error instanceof Error ? error.message : t("恢复失败"),
                    ),
                  );
              }}
            >
              {t("恢复已关闭通知")}
            </button>
          )}
          {menuError && <p role="alert">{t(menuError)}</p>}
          {activity.sessionId && (
            <button
              role="menuitem"
              onClick={() => {
                open();
                setMenu(false);
              }}
            >
              {t("查看任务")}
            </button>
          )}
          <hr />
          <button
            role="menuitem"
            onClick={() => {
              settings();
              setMenu(false);
            }}
          >
            {t("宠物设置")}
          </button>
          <button
            role="menuitem"
            onClick={() => {
              void update({ visible: false }).catch(() => {});
            }}
          >
            {t("收起宠物")}
          </button>
        </div>
      )}
    </div>
  );
}
export function Companion({
  controller,
  activity = IDLE,
  open = () => {},
  settings = () => {},
  tray,
}: {
  controller: PetController;
  activity?: Activity;
  tray?: TrayProps;
  open?(): void;
  settings?(): void;
}) {
  const t = translator(controller.language);
  const library = controller.library;
  const selected = library?.pets.find(
    (item) => item.id === library.config.selected,
  );
  const pet = useMemo(
    () =>
      selected
        ? { ...selected, displayLocale: controller.language }
        : undefined,
    [selected, controller.language],
  );
  if (!pet || !library?.config.visible) return null;
  return (
    <FloatingPet
      pet={pet}
      config={library.config}
      activity={activity}
      tray={tray}
      update={controller.update}
      open={open}
      settings={settings}
    />
  );
}
