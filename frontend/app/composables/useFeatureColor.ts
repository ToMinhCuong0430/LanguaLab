export function useFeatureColor() {
  const route = useRoute()

  const featureMap: Record<string, string> = {
    '/': 'home',
    '/go-cau': 'go-cau',
    '/video-podcast': 'video-podcast',
    '/ngu-phap': 'ngu-phap',
    '/tu-vung': 'tu-vung',
    '/tu-vung-phat-am': 'tu-vung',
    '/doc-dich': 'doc-dich',
    '/tu-dien': 'tu-dien',
    '/luyen-thi': 'luyen-thi',
    '/yeu-cau-tinh-nang': 'yeu-cau-tinh-nang',
    '/admin': 'admin',
  }

  const currentFeature = computed(() => {
    const path = route.path
    if (featureMap[path]) return featureMap[path]
    for (const [key, val] of Object.entries(featureMap)) {
      if (key !== '/' && path.startsWith(key)) return val
    }
    return 'home'
  })

  if (import.meta.client) {
    watch(currentFeature, (val) => {
      document.body.setAttribute('data-feature', val)
    }, { immediate: true })
  }

  return { currentFeature }
}
