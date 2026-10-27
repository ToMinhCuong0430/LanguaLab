export default defineNuxtRouteMiddleware(async () => {
  // 1. Kiểm tra xác thực phía Supabase Auth
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/dang-nhap?redirect=/admin')
  }

  // 2. Kiểm tra quyền Admin an toàn bằng RPC `is_admin`
  const client = useSupabaseClient()

  try {
    const { data: isAdmin, error } = await client.rpc('is_admin')

    if (error || !isAdmin) {
      // Chuyển hướng người dùng không có quyền về trang chủ
      return navigateTo({
        path: '/',
        query: { auth_error: 'forbidden_admin' },
      })
    }
  } catch {
    return navigateTo('/')
  }
})
