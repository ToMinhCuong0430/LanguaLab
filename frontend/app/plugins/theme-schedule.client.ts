import { readAutoPreference } from '~/composables/useTheme'

// Khôi phục chế độ "Theo giờ" sau khi tải trang và kiểm tra lại mỗi phút.
// Chạy sau khi app sẵn sàng để không ghi đè lúc @nuxtjs/color-mode còn đang khôi phục
// và để tránh lệch hydration với HTML render từ server.
export default defineNuxtPlugin(() => {
  const autoEnabled = useState<boolean>('theme-auto', () => false)
  const { applySchedule } = useTheme()

  onNuxtReady(() => {
    autoEnabled.value = readAutoPreference()
    applySchedule()
    window.setInterval(applySchedule, 60_000)
  })
})
