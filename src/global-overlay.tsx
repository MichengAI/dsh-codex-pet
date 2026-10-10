import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** 独立于页面布局。必须留在 body 下，Codex UI 设置页靠这个位置放行；零尺寸避免官方 macOS 把铺满的 body 子节点当成整窗禁拖区。 */
export function GlobalOverlay({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const element = document.createElement("div");
    element.setAttribute("data-dsh-pet-overlay", "");
    element.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483000;pointer-events:none";
    document.body.append(element);
    setContainer(element);
    return () => element.remove();
  }, []);
  return container ? createPortal(children, container) : null;
}
