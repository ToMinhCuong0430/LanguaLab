import type { Database } from '~/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

export const useAuth = () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const router = useRouter()

  const profile = useState<Profile | null>('user-profile', () => null)
  const isAdmin = useState<boolean>('user-is-admin', () => false)
  const isLoading = ref(false)
  const authError = ref<string | null>(null)

  // Dịch thông báo lỗi của Supabase Auth sang tiếng Việt thân thiện
  const translateAuthError = (err: any): string => {
    if (!err) return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
    const msg = typeof err === 'string' ? err : err.message || ''

    if (msg.includes('Invalid login credentials')) {
      return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
    }
    if (msg.includes('User already registered')) {
      return 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.'
    }
    if (msg.includes('Email not confirmed')) {
      return 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra hộp thư email để xác thực.'
    }
    if (msg.includes('Password should be at least') || msg.includes('weak password')) {
      return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số.'
    }
    if (msg.includes('rate limit') || msg.includes('Too many requests')) {
      return 'Bạn đã thực hiện thao tác quá nhiều lần. Vui lòng chờ ít phút rồi thử lại.'
    }
    if (msg.includes('Email rate limit exceeded')) {
      return 'Đã gửi quá số email cho phép trong thời gian ngắn. Vui lòng thử lại sau.'
    }
    if (msg.includes('User not found')) {
      return 'Không tìm thấy tài khoản với email này.'
    }
    if (msg.includes('invalid email')) {
      return 'Địa chỉ email không đúng định dạng.'
    }

    return msg || 'Lỗi xác thực hệ thống. Vui lòng thử lại.'
  }

  // Tải thông tin Profile từ bảng `profiles` và kiểm tra quyền admin
  const fetchProfile = async (): Promise<Profile | null> => {
    if (!user.value) {
      profile.value = null
      isAdmin.value = false
      return null
    }

    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .maybeSingle()

      if (error) {
        console.warn('Lỗi khi tải profile:', error.message)
        return null
      }

      profile.value = data

      // Kiểm tra RPC is_admin
      try {
        const { data: adminRes } = await client.rpc('is_admin')
        isAdmin.value = Boolean(adminRes)
      } catch {
        isAdmin.value = false
      }

      return data
    } catch (e) {
      return null
    }
  }

  // Lắng nghe khi user thay đổi để tự động fetch profile
  watch(
    () => user.value?.id,
    async (newId) => {
      if (newId) {
        await fetchProfile()
      } else {
        profile.value = null
      }
    },
    { immediate: true },
  )

  // 1. Đăng nhập với Email & Mật khẩu
  const signIn = async (email: string, password: string) => {
    isLoading.value = true
    authError.value = null

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        authError.value = translateAuthError(error)
        return { success: false, error: authError.value }
      }

      await fetchProfile()
      await router.push('/')
      return { success: true, data }
    } catch (err: any) {
      authError.value = translateAuthError(err)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  // 2. Đăng ký tài khoản mới
  const signUp = async (email: string, password: string, fullName: string) => {
    isLoading.value = true
    authError.value = null

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
        },
      })

      if (error) {
        authError.value = translateAuthError(error)
        return { success: false, error: authError.value }
      }

      // Nếu đã có session ngay (email confirmation tắt hoặc auto-login)
      if (data.session) {
        await fetchProfile()
        await router.push('/')
      }

      return { success: true, data }
    } catch (err: any) {
      authError.value = translateAuthError(err)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  // 3. Đăng nhập Google qua OAuth
  const signInWithGoogle = async () => {
    isLoading.value = true
    authError.value = null

    try {
      const redirectOrigin = import.meta.client ? window.location.origin : 'http://localhost:3000'
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        authError.value = translateAuthError(error)
        return { success: false, error: authError.value }
      }

      return { success: true, data }
    } catch (err: any) {
      authError.value = translateAuthError(err)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  // 4. Đăng xuất
  const signOut = async () => {
    isLoading.value = true
    try {
      await client.auth.signOut()
      profile.value = null
      await router.push('/dang-nhap')
    } catch (e) {
      console.error('Lỗi khi đăng xuất:', e)
    } finally {
      isLoading.value = false
    }
  }

  // 5. Yêu cầu đặt lại mật khẩu qua email
  const resetPassword = async (email: string) => {
    isLoading.value = true
    authError.value = null

    try {
      const redirectOrigin = import.meta.client ? window.location.origin : 'http://localhost:3000'
      const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${redirectOrigin}/quen-mat-khau`,
      })

      if (error) {
        authError.value = translateAuthError(error)
        return { success: false, error: authError.value }
      }

      return { success: true, data }
    } catch (err: any) {
      authError.value = translateAuthError(err)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  // 6. Cập nhật hồ sơ (Onboarding hoặc chỉnh sửa Profile)
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user.value) return { success: false, error: 'Chưa đăng nhập' }
    isLoading.value = true

    try {
      const { data, error } = await client
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.value.id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      profile.value = data
      return { success: true, data }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      isLoading.value = false
    }
  }

  // Kiểm tra xem người dùng cần thiết lập hồ sơ ban đầu không
  const needsOnboarding = computed(() => {
    if (!user.value || !profile.value) return false
    // Nếu chưa có tên đầy đủ hoặc band mục tiêu
    return !profile.value.full_name || profile.value.full_name === 'Người học mới'
  })

  return {
    user,
    profile,
    isAdmin,
    isLoading,
    authError,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    fetchProfile,
    updateProfile,
    needsOnboarding,
  }
}
