export type ThemeMode = 'light' | 'dark' | 'system'

export function applyTheme(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function getTheme(): ThemeMode {
  return (localStorage.getItem('theme') as ThemeMode) ?? 'system'
}

export function setTheme(mode: ThemeMode) {
  localStorage.setItem('theme', mode)
  applyTheme(mode)
}
