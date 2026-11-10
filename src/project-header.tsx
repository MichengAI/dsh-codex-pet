/** 标题链接由 React 渲染，纯净展示项目头部与外链。 */
import React, { useSyncExternalStore } from "react";
import { GithubMark16, FeedbackMark16 } from "./project-icons.tsx";
import { translator } from "./ui-locales.ts";
import type { PetLocaleStore } from "./pet-locales.ts";

declare const __PET_VERSION__: string;

export function ProjectHeader({ locale }: { locale?: PetLocaleStore }) {
  const language = useSyncExternalStore(
    (fn) => locale?.subscribe(fn) ?? (() => {}),
    () => locale?.getSnapshot().active ?? "zh",
  );
  const t = translator(language);

  return (
    <>
      <style>{`.dcp-project-head{display:flex;align-items:center;justify-content:flex-start;gap:8px 12px;flex-wrap:wrap;margin-bottom:0}.dcp-project-head h1{display:inline-flex;align-items:baseline;margin:0;white-space:nowrap}.dcp-version{font-size:12px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-tertiary,#9da1aa);margin-left:10px}.dcp-project-links{display:flex;align-items:center;justify-content:flex-start;gap:8px;flex-wrap:nowrap;flex:0 0 auto}.dcp-project-links a{display:inline-flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box;min-height:28px;height:28px;padding:0 10px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2,#383838));border-radius:var(--dsw-radius-sm,7px);background:transparent;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap;cursor:pointer}.dcp-project-links a:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0a);color:var(--dsw-alias-label-primary,inherit)}.dcp-project-links a:focus-visible{outline:var(--dsw-focus-ring-width,1px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#4f8cff));outline-offset:2px}.dcp-project-links svg{display:block;flex:none;width:16px;height:16px}`}</style>
      <header className="dcp-project-head">
        <h1>
          {t("宠物")}
          <span className="dcp-version">v{__PET_VERSION__}</span>
        </h1>
        {/* 用 div + role=navigation 而不是 <nav>：DSH 设置皮肤的
            `[data-shortcut-modal="settings"] nav button` 会把任何 nav 里的按钮
            改写成 32px 全宽胶囊（!important），导致换行错位。 */}
        <div
          className="dcp-project-links"
          role="navigation"
          aria-label={t("项目链接")}
        >
          <a
            href="https://github.com/MichengAI/dsh-codex-pet"
            target="_blank"
            rel="noreferrer"
          >
            <GithubMark16 />
            GitHub
          </a>
          <a
            href="https://github.com/MichengAI/dsh-codex-pet/issues"
            target="_blank"
            rel="noreferrer"
          >
            <FeedbackMark16 />
            {t("问题反馈")}
          </a>
        </div>
      </header>
    </>
  );
}
