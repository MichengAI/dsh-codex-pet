/** 原生透明窗口渲染入口，设置由 DSH 插槽提供。 */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingPet } from './ui.tsx';
import { styles } from './styles.ts';
import type { DesktopState } from './model.ts';
function Desktop() {
  const [state, setState] = useState<DesktopState | null>(null);
  useEffect(() => {
    document.body.className = 'dcp-desktop';
    const bridge = window.petWindow; if (!bridge) return;
    const off = bridge.onState(setState); bridge.ready();
    const pointer = (event: PointerEvent) => bridge.pointer(!!(event.target as Element).closest('button,.dcp-menu,.dcp-tray,input,textarea,select'));
    document.addEventListener('pointermove', pointer);
    return () => { off(); document.removeEventListener('pointermove', pointer); };
  }, []);
  return <><style>{styles}</style>{state && <FloatingPet {...state} tray={state.notifications && window.petWindow?.command ? { state: state.notifications, command: window.petWindow.command } : undefined} native update={async () => {}} open={() => window.petWindow?.action('open')} settings={() => window.petWindow?.action('settings')} />}</>;
}
createRoot(document.getElementById('root')!).render(<Desktop />);
