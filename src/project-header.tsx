/** 标题链接由 React 渲染，纯净展示项目头部与外链。 */
import React, { useSyncExternalStore } from "react";
import { Button, IconListPenOutlineMedium } from "@deepseek-ai/dsh-client-ui-primitives";
import { GithubMark16 } from "./project-icons.tsx";
import { translator } from "./ui-locales.ts";
import type { PetLocaleStore } from "./pet-locales.ts";

export function ProjectHeader({ locale }: { locale?: PetLocaleStore }) {
  const language = useSyncExternalStore(
    (fn) => locale?.subscribe(fn) ?? (() => {}),
    () => locale?.getSnapshot().active ?? "zh",
  );
  const t = translator(language);

  return (
    <div className="dcp-project-card">
      <style>{`.dcp-project-card{box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:18px 20px;background:var(--dsw-alias-bg-layer-2,#18181b);border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,0.08));border-radius:12px;margin-bottom:16px}.dcp-project-title-row{display:flex;align-items:center;gap:8px 12px;min-width:0;flex-wrap:wrap}.dcp-project-title{margin:0;font-size:24px;line-height:32px;font-weight:600;letter-spacing:-.4px;color:var(--dsw-alias-label-primary);display:inline-flex;align-items:baseline;white-space:nowrap}.dcp-project-links{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;flex:0 0 auto}.dcp-project-desc{margin:0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary)}body:not([data-ds-dark-theme]) .dcp-project-card{background:var(--dsw-alias-bg-layer-2,#ffffff);border-color:var(--dsw-alias-border-l1,rgba(0,0,0,0.08))}`}</style>
      <header className="dcp-project-title-row">
        <h2 className="dcp-project-title">{t("宠物")}</h2>
        <div
          className="dcp-project-links"
          role="navigation"
          aria-label={t("项目链接")}
        >
          <Button
            variant="outline"
            size="sm"
            icon={<GithubMark16 />}
            aria-label="GitHub"
            onClick={() => {
              window.open(
                "https://github.com/MichengAI/dsh-codex-pet",
                "_blank",
                "noreferrer",
              );
            }}
          >
            GitHub
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<IconListPenOutlineMedium size={14} />}
            aria-label={t("问题反馈")}
            onClick={() => {
              window.open(
                "https://github.com/MichengAI/dsh-codex-pet/issues",
                "_blank",
                "noreferrer",
              );
            }}
          >
            {t("问题反馈")}
          </Button>
        </div>
      </header>
      <p className="dcp-project-desc">{t("桌面宠物陪伴式交互，实时提示关键任务进展并突出需要关注的事项")}</p>
    </div>
  );
}
