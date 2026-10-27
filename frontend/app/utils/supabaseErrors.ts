/**
 * Tiện ích dịch lỗi Supabase sang tiếng Việt và điều hướng khi hết hạn phiên
 */

export function translateSupabaseError(error: any): string {
  if (!error) return 'Đã có lỗi không xác định xảy ra.'

  const message: string = error.message || String(error)
  const code: string = error.code || ''
  const status: number = error.status || 0

  // 1. Lỗi hết hạn phiên đăng nhập hoặc không xác thực
  if (
    status === 401 ||
    message.includes('JWT expired') ||
    message.includes('session_not_found') ||
    message.includes('Auth session missing') ||
    message.includes('token is expired')
  ) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
  }

  // 2. Lỗi bảo vệ hàng RLS (Row Level Security)
  if (
    code === '42501' ||
    message.includes('permission denied') ||
    message.includes('violates row-level security policy')
  ) {
    return 'Bạn không có quyền thực hiện hành động này (bảo vệ RLS).'
  }

  // 3. Lỗi mạng / Không kết nối được Supabase
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('network') ||
    message.includes('ECONNREFUSED')
  ) {
    return 'Lỗi kết nối mạng đến máy chủ. Vui lòng kiểm tra đường truyền và thử lại.'
  }

  // 4. Lỗi trùng lặp dữ liệu (Unique Constraint)
  if (code === '23505' || message.includes('duplicate key')) {
    return 'Dữ liệu này đã tồn tại trong hệ thống (trùng lặp).'
  }

  // 5. Lỗi giới hạn trigger (vd: vượt 1000 dòng phụ đề)
  if (message.includes('1000 dòng phụ đề')) {
    return 'Vượt quá giới hạn tối đa 1000 dòng phụ đề cho video cá nhân.'
  }

  // 6. Lỗi trần XP
  if (message.includes('500 XP')) {
    return 'Bạn đã đạt giới hạn tối đa 500 XP cho ngày hôm nay.'
  }

  return message
}

export function handleAuthExpired(error: any): boolean {
  if (!error) return false
  const message: string = error.message || String(error)
  const status: number = error.status || 0

  if (
    status === 401 ||
    message.includes('JWT expired') ||
    message.includes('session_not_found') ||
    message.includes('Auth session missing') ||
    message.includes('token is expired')
  ) {
    if (import.meta.client) {
      navigateTo('/dang-nhap')
    }
    return true
  }
  return false
}
