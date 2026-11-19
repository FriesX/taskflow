export type ThemeMode = 'light' | 'dark' | 'system'

export function resolveDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', resolveDark(mode))
}

export function getTheme(): ThemeMode {
  return (localStorage.getItem('theme') as ThemeMode) ?? 'system'
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem('theme', mode)
  applyTheme(mode)
  window.dispatchEvent(new CustomEvent('taskflow-theme-change', { detail: mode }))
}

export function toggleLightDark(): ThemeMode {
  const next: ThemeMode = resolveDark(getTheme()) ? 'light' : 'dark'
  setTheme(next)
  return next
}
