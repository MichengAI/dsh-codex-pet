import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** 独立于页面布局；设置页仅保留这个专用宠物容器。 */
export function GlobalOverlay({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = document.createElement("div");
    element.setAttribute("data-dsh-pet-overlay", "");
    element.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none";
    document.body.append(element);
    setContainer(element);
    return () => element.remove();
  }, []);
  return container ? createPortal(children, container) : null;
}
