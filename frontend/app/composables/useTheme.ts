export type ThemeMode = 'light' | 'dark' | 'system' | 'auto'

const AUTO_STORAGE_KEY = 'langua-theme-auto'

// Cùng mốc với buổi "tối" của Home Hero (18h - 5h)
export const isNightHour = (hour: number) => hour >= 18 || hour < 5

export const useTheme = () => {
  const colorMode = useColorMode()
  const autoEnabled = useState<boolean>('theme-auto', () => false)

  const isDark = computed(() => colorMode.value === 'dark')

  const mode = computed<ThemeMode>(() => {
    if (autoEnabled.value) return 'auto'
    return colorMode.preference as ThemeMode
  })

  // Chế độ "Theo giờ": tự chọn sáng/tối theo giờ hiện tại của máy người dùng
  const applySchedule = () => {
    if (!autoEnabled.value) return
    const next = isNightHour(new Date().getHours()) ? 'dark' : 'light'
    if (colorMode.preference !== next) colorMode.preference = next
  }

  const persistAuto = (enabled: boolean) => {
    if (!import.meta.client) return
    try {
      if (enabled) localStorage.setItem(AUTO_STORAGE_KEY, '1')
      else localStorage.removeItem(AUTO_STORAGE_KEY)
    } catch {
      // Bỏ qua khi trình duyệt chặn localStorage
    }
  }

  const setMode = (next: ThemeMode) => {
    autoEnabled.value = next === 'auto'
    persistAuto(autoEnabled.value)
    if (next === 'auto') applySchedule()
    else colorMode.preference = next
  }

  const toggleTheme = () => {
    setMode(isDark.value ? 'light' : 'dark')
  }

  return {
    colorMode,
    isDark,
    mode,
    setMode,
    applySchedule,
    toggleTheme,
  }
}

export const readAutoPreference = () => {
  try {
    return localStorage.getItem(AUTO_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
