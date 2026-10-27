export type LearningLanguage = 'en' | 'zh' | 'ja'

export interface LanguageOption {
  code: LearningLanguage
  name: string
  nativeName: string
  flag: string
  levelLabels: string[]
  description: string
  accentColor: string
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
  },
  {
    code: 'zh',
    name: 'Tiếng Trung',
    nativeName: '中文 (Hán ngữ)',
    flag: '🇨🇳',
    levelLabels: ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6', 'HSK 3.0'],
    description: 'Chữ Hán, Bính âm (Pinyin), ngữ pháp HSK và khẩu ngữ đời sống',
    accentColor: '#D92B1F',
  },
  {
    code: 'ja',
    name: 'Tiếng Nhật',
    nativeName: '日本語 (Nihongo)',
    flag: '🇯🇵',
    levelLabels: ['N5', 'N4', 'N3', 'N2', 'N1'],
    description: 'Hiragana, Katakana, Kanji và cấu trúc luyện thi JLPT',
    accentColor: '#FF5A87',
  },
]

export const useLanguage = () => {
  const currentLang = useState<LearningLanguage>('learning_lang', () => 'en')
  const isReady = ref(false)

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_learning_lang') as LearningLanguage | null
      if (saved && (saved === 'en' || saved === 'zh' || saved === 'ja')) {
        currentLang.value = saved
      }
      isReady.value = true
      document.documentElement.setAttribute('data-lang', currentLang.value)
    }
  })

  const setLanguage = (lang: LearningLanguage) => {
    currentLang.value = lang
    if (import.meta.client) {
      localStorage.setItem('langua_learning_lang', lang)
      document.documentElement.setAttribute('data-lang', lang)
    }
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
  }
}
