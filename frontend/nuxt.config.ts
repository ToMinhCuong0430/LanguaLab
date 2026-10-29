export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {},
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/fonts',
    '@nuxtjs/supabase',
  ],

  supabase: {
    redirectOptions: {
      login: '/dang-nhap',
      callback: '/',
      exclude: [
        '/dang-nhap',
        '/dang-ky',
        '/quen-mat-khau',
        '/dieu-khoan',
        '/chinh-sach-quyen-rieng-tu',
      ],
      cookieRedirect: false,
    },
    types: '~/types/database.types.ts',
  },

  css: ['~/assets/css/tailwind.css'],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    dataValue: 'theme',
    storageKey: 'langua-color-mode',
  },

  fonts: {
    families: [
      {
        name: 'Space Grotesk',
        provider: 'google',
        weights: [500, 700],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
      },
      {
        name: 'Be Vietnam Pro',
        provider: 'google',
        weights: [400, 500, 600, 700],
        subsets: ['latin', 'latin-ext', 'vietnamese'],
      },
    ],
  },

  routeRules: {
    '/video': { redirect: { to: '/video-podcast', statusCode: 301 } },
    '/video/**': { redirect: { to: '/video-podcast', statusCode: 301 } },
    '/tu-vung-phat-am': { redirect: { to: '/tu-vung', statusCode: 301 } },
    '/tu-vung-phat-am/**': { redirect: { to: '/tu-vung', statusCode: 301 } },
    '/ho-so': { redirect: { to: '/cai-dat?tab=profile', statusCode: 301 } },
  },

  app: {
    head: {
      title: 'LanguaLab - Học Ngoại Ngữ & Luyện Thi',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'LanguaLab - Nền tảng học ngoại ngữ và luyện thi phi thương mại',
        },
      ],
      htmlAttrs: { lang: 'vi' },
    },
  },

  vite: {
    optimizeDeps: {
      include: ['@lucide/vue'],
    },
  },
})
