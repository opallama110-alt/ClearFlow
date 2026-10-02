import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'clearflow-theme'

export const readThemePreference = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

const resolveTheme = (preference: ThemePreference) =>
  preference === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference

/** Menerapkan tema ke <html> dan menyamakan warna bilah status browser. */
export const applyTheme = (preference: ThemePreference) => {
  const root = document.documentElement
  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', resolveTheme(preference) === 'dark' ? '#0b1424' : '#f6f8fd')
}

export const useTheme = () => {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return undefined
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const sync = () => applyTheme('system')
    media?.addEventListener('change', sync)
    return () => media?.removeEventListener('change', sync)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === 'system') window.localStorage.removeItem(STORAGE_KEY)
      else window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Penyimpanan bisa diblokir; tema tetap berlaku untuk sesi ini.
    }
    setPreferenceState(next)
  }, [])

  return { preference, setPreference }
}
