/** Codex 内置 Lucide PawPrint 几何，仅适配 Codex UI 的设置导航按钮。 */
const PAW = '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>';
export function observePetSettingsIcon(): () => void {
  const apply = () => {
    for (const button of document.querySelectorAll('.dcu-settings-link')) {
      if (button.textContent?.trim() !== '宠物') continue;
      const svg = button.querySelector('svg');
      if (!svg || svg.getAttribute('data-pet-icon') === 'codex-paw') continue;
      svg.setAttribute('data-pet-icon', 'codex-paw');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = PAW;
    }
  };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
