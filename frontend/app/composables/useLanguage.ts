export type LearningLanguage = 'en' | 'zh' | 'ja'

export type LanguageStatus = 'available' | 'in_development'

export interface LanguageOption {
  code: LearningLanguage
  name: string
  nativeName: string
  flag: string
  levelLabels: string[]
  description: string
  accentColor: string
  status: LanguageStatus
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'Tiếng Anh',
    nativeName: 'English',
    flag: '🇬🇧',
    levelLabels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS 7.0+'],
    description: 'Luyện thi IELTS, TOEIC, giao tiếp học thuật và công sở',
    accentColor: '#2F5BFF',
    status: 'available',
  },
  {
    code: 'zh',
    name: 'Tiếng Trung',
    nativeName: '中文 (Hán ngữ)',
    flag: '🇨🇳',
    levelLabels: ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'HSK 3.0'],
    description: 'Chữ Hán, Bính âm (Pinyin), ngữ pháp HSK và khẩu ngữ đời sống',
    accentColor: '#D92B1F',
    status: 'in_development',
  },
  {
    code: 'ja',
    name: 'Tiếng Nhật',
    nativeName: '日本語 (Nihongo)',
    flag: '🇯🇵',
    levelLabels: ['N5', 'N4', 'N3', 'N2', 'N1'],
    description: 'Hiragana, Katakana, Kanji và cấu trúc luyện thi JLPT',
    accentColor: '#FF5A87',
    status: 'in_development',
  },
]

export const isLanguageAvailable = (code: LearningLanguage): boolean => {
  const opt = SUPPORTED_LANGUAGES.find(l => l.code === code)
  return opt?.status === 'available'
}

export const AVAILABLE_LANGUAGES: LearningLanguage[] = SUPPORTED_LANGUAGES
  .filter(l => l.status === 'available')
  .map(l => l.code)

export const useLanguage = () => {
  const currentLang = useState<LearningLanguage>('learning_lang', () => 'en')
  const isReady = ref(false)

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_learning_lang') as LearningLanguage | null
      if (saved && !isLanguageAvailable(saved)) {
        // Đặt về tiếng Anh và ghi đè localStorage nếu người dùng từng lưu tiếng Trung hoặc Nhật
        currentLang.value = 'en'
        localStorage.setItem('langua_learning_lang', 'en')
      } else if (saved === 'en') {
        currentLang.value = saved
      } else {
        currentLang.value = 'en'
      }
      isReady.value = true
      document.documentElement.setAttribute('data-lang', currentLang.value)
    }
  })

  const setLanguage = (lang: LearningLanguage): boolean => {
    if (!isLanguageAvailable(lang)) {
      return false
    }
    currentLang.value = lang
    if (import.meta.client) {
      localStorage.setItem('langua_learning_lang', lang)
      document.documentElement.setAttribute('data-lang', lang)
    }
    return true
  }

  const currentLanguageOption = computed(() => {
    return SUPPORTED_LANGUAGES.find(l => l.code === currentLang.value) || SUPPORTED_LANGUAGES[0]
  })

  return {
    currentLang,
    isReady,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageOption,
    setLanguage,
    isLanguageAvailable,
    availableLanguages: AVAILABLE_LANGUAGES,
  }
}
