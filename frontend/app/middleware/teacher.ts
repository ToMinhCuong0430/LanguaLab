// Chặn trang giáo viên với người không có vai trò teacher / admin.
// Đây chỉ là lớp chặn giao diện; quyền thật được kiểm tra trong RPC và RLS ở server.
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo(`/dang-nhap?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  const { loadRole } = useClasses()
  const role = await loadRole()
  if (role !== 'teacher' && role !== 'admin') {
    return navigateTo({ path: '/lop-hoc', query: { auth_error: 'forbidden_teacher' } })
  }
})
