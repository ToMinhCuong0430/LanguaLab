// Quản lý trạng thái xem hướng dẫn lần đầu (First Visit Tour) theo từng trang
// Lưu cờ vào localStorage để không hiện lại sau khi người dùng đã xem hoặc bấm Bỏ qua.

export const useFirstVisit = (pageKey: string) => {
  const storageKey = `langua_tour_${pageKey}_visited`
  const hasVisited = ref(true) // Mặc định true để tránh nhấp nháy trên SSR
  const isLoaded = ref(false)

  onMounted(() => {
    if (import.meta.client) {
      const stored = localStorage.getItem(storageKey)
      hasVisited.value = stored === 'true'
      isLoaded.value = true
    }
  })

  const markAsVisited = () => {
    hasVisited.value = true
    if (import.meta.client) {
      localStorage.setItem(storageKey, 'true')
    }
  }

  const resetVisit = () => {
    hasVisited.value = false
    if (import.meta.client) {
      localStorage.removeItem(storageKey)
    }
  }

  return {
    hasVisited,
    isLoaded,
    markAsVisited,
    resetVisit,
  }
}
