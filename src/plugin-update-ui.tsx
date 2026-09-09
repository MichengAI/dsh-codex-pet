/** 标题链接由 React 渲染，更新弹窗直接复用同系列实现。 */
import React, { useEffect, useRef, useSyncExternalStore } from "react";
import { GithubMark16, FeedbackMark16 } from "./project-icons.tsx";
import {
  observePluginUpdate,
  type PluginUpdateIconName,
} from "./shared-plugin-update-ui.ts";
import { BASE } from "./model.ts";
import type { PetLocaleStore } from "./pet-locales.ts";
declare const __PET_VERSION__: string;
const UPDATE_ICON_PATHS: Record<PluginUpdateIconName, readonly string[]> = {
  refresh: ["M13.5 5.5V2.5m0 0h-3m3 0-2.1 2.1A5.5 5.5 0 1 0 13.2 12"],
  download: ["M8 2v8m0 0 3-3m-3 3-3-3M3 13v2h10v-2"],
  copy: ["M5 5h8v8H5z", "M3 3h8"],
  close: ["m4 4 8 8M12 4 4 12"],
};

function createPluginUpdateIcon(name: PluginUpdateIconName): HTMLElement {
  const element = document.createElement("span");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of UPDATE_ICON_PATHS[name]) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  element.append(svg);
  return element;
}

export function PluginUpdateHeader({ locale }: { locale?: PetLocaleStore }) {
  const language = useSyncExternalStore(
    (fn) => locale?.subscribe(fn) ?? (() => {}),
    () => locale?.getSnapshot().active ?? "zh",
  );
  const zh = /^zh(?:-|$)/i.test(language);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    return observePluginUpdate({
      language,
      root: root.current,
      endpoint: `${BASE}/api/update`,
      packageName: "@michengai/dsh-codex-pet",
      titleRowSelector: ".dcp-project-head",
      linksSelector: ".dcp-project-links",
      zhName: "宠物",
      enName: "Pets",
      createIcon: createPluginUpdateIcon,
    });
  }, [language]);
  return (
    <>
      <style>{`.dcp-project-head{display:flex;align-items:center;justify-content:flex-start;gap:8px 12px;flex-wrap:wrap;margin-bottom:24px}.dcp-project-head h1{display:inline-flex;align-items:baseline;margin:0;white-space:nowrap}.dcp-version{font-size:12px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-tertiary,#9da1aa);margin-left:10px}.dcp-project-links{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.dcp-project-links a,.dcp-project-links button{display:inline-flex;align-items:center;justify-content:center;gap:5px;box-sizing:border-box;min-height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#383838);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,inherit);font-family:inherit;font-size:12px;font-weight:500;line-height:18px;text-decoration:none;white-space:nowrap;cursor:pointer}.dcp-project-links a:hover,.dcp-project-links button:hover{background:var(--dsw-alias-interactive-bg-hover,#ffffff0a);color:var(--dsw-alias-label-primary,inherit)}.dcp-project-links a:focus-visible,.dcp-project-links button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4f8cff);outline-offset:2px}.dcp-project-links svg{display:block;flex:none;width:16px;height:16px}`}</style>
      <header ref={root} className="dcp-project-head">
        <h1>
          {zh ? "宠物" : "Pets"}
          <span className="dcp-version">v{__PET_VERSION__}</span>
        </h1>
        <nav className="dcp-project-links">
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
            {zh ? "问题反馈" : "Issues"}
          </a>
        </nav>
      </header>
    </>
  );
}
