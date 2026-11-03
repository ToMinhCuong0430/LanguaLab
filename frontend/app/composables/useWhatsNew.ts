import { WHATS_NEW_RELEASES, type WhatsNewRelease } from '~/constants/whatsNew'

const STORAGE_KEY = 'langua_whats_new_seen'

export const useWhatsNew = () => {
  const isOpen = useState<boolean>('whats_new_modal_open', () => false)
  const isManualView = useState<boolean>('whats_new_manual_view', () => false)

  const latestRelease = computed<WhatsNewRelease>(() => WHATS_NEW_RELEASES[0])
  const latestVersion = computed<string>(() => latestRelease.value?.version || '2026.11.02')

  const releasesToShow = computed<WhatsNewRelease[]>(() => {
    if (isManualView.value) {
      return WHATS_NEW_RELEASES.slice(0, 5)
    }
    return [latestRelease.value].filter(Boolean)
  })

  const markSeen = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, latestVersion.value)
    } catch (err) {
      console.warn('Lỗi lưu trạng thái whats_new_seen:', err)
    }
  }

  const close = () => {
    isOpen.value = false
    if (!isManualView.value) {
      markSeen()
    }
    isManualView.value = false
  }

  const openManual = () => {
    isManualView.value = true
    isOpen.value = true
  }

  const checkAndShowOnMount = () => {
    if (!import.meta.client) return

    try {
      const seenVersion = localStorage.getItem(STORAGE_KEY)

      // Kiểm tra người dùng cũ: có khóa langua_learning_lang hoặc bất kỳ khóa nào bắt đầu bằng langua_tour_
      let isReturningUser = false
      if (localStorage.getItem('langua_learning_lang')) {
        isReturningUser = true
      } else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('langua_tour_')) {
            isReturningUser = true
            break
          }
        }
      }

      // Người hoàn toàn mới: không hiện popup, chỉ tự động đánh dấu bản mới nhất
      if (!isReturningUser && !seenVersion) {
        localStorage.setItem(STORAGE_KEY, latestVersion.value)
        return
      }

      // Nếu đã xem phiên bản mới nhất rồi thì không hiện
      if (seenVersion === latestVersion.value) {
        return
      }

      // Người dùng cũ có phiên bản mới: chờ 1.5s và kiểm tra không đè lên modal khác
      let attempts = 0
      const maxAttempts = 30

      const checkTimer = setTimeout(() => {
        const intervalId = setInterval(() => {
          attempts++
          // Kiểm tra xem có dialog/modal nào đang hiển thị không (trừ chính modal này)
          const activeDialog = document.querySelector('[role="dialog"][aria-modal="true"]:not([data-whats-new="true"])')
          
          if (!activeDialog) {
            clearInterval(intervalId)
            isManualView.value = false
            isOpen.value = true
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId)
            // Quá thời gian chờ, vẫn mở nếu phù hợp
            isManualView.value = false
            isOpen.value = true
          }
        }, 1000)
      }, 1500)
    } catch (err) {
      console.warn('Lỗi kiểm tra hiển thị WhatsNewModal:', err)
    }
  }

  return {
    isOpen,
    isManualView,
    latestRelease,
    releasesToShow,
    markSeen,
    close,
    openManual,
    checkAndShowOnMount,
  }
}
