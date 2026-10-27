import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'

export type FeatureCategory = 'luyen_thi' | 'tu_vung' | 'nghe_noi' | 'tien_ich' | 'cong_dong'
export type FeatureStatus = 'new' | 'under_review' | 'in_progress' | 'completed' | 'rejected'

export interface FeatureComment {
  id: string
  authorName: string
  avatarText: string
  content: string
  createdAt: string
}

export interface FeatureRequest {
  id: string
  title: string
  description: string
  category: FeatureCategory
  status: FeatureStatus
  upvotes: number
  hasVoted?: boolean
  authorName: string
  createdAt: string
  tags: string[]
  comments: FeatureComment[]
}

// Mock dữ liệu đủ cả 5 trạng thái: new, under_review, in_progress, completed, rejected
export const MOCK_FEATURE_REQUESTS_V2: FeatureRequest[] = [
  {
    id: 'feat-1',
    title: 'Hỗ trợ xuất bộ thẻ Flashcard Anki (.apkg)',
    description: 'Cho phép người học export trực tiếp các từ vựng đã lưu hoặc bộ từ theo chủ đề ra định dạng của Anki để ôn offline trên điện thoại.',
    category: 'tu_vung',
    status: 'in_progress', // ĐANG LÀM
    upvotes: 142,
    authorName: 'Minh Hoàng',
    createdAt: '2026-10-18',
    tags: ['Anki', 'SRS', 'Export'],
    comments: [
      {
        id: 'c1',
        authorName: 'Thu Trang',
        avatarText: 'TT',
        content: 'Rất cần tính năng này ạ! Em hay đi tàu điện ngầm không có mạng 4G, xuất ra Anki ôn thì tiện tuyệt vời.',
        createdAt: '2026-10-19 09:30',
      },
      {
        id: 'c2',
        authorName: 'Đội ngũ LanguaLab',
        avatarText: 'LA',
        content: 'Chào bạn, đội ngũ đang tích hợp thư viện tạo file .apkg trực tiếp trên trình duyệt, dự kiến sẽ ra mắt trong tuần tới!',
        createdAt: '2026-10-20 14:15',
      },
    ],
  },
  {
    id: 'feat-2',
    title: 'Chấm điểm phát âm chi tiết từng âm vị (Phoneme scoring)',
    description: 'Sử dụng phân tích sóng âm để chỉ ra chính xác âm nào người học phát âm chưa chuẩn (ví dụ âm /θ/, /ð/, /r/ và /l/) thay vì chỉ chấm chung chung.',
    category: 'nghe_noi',
    status: 'under_review', // ĐANG XEM XÉT
    upvotes: 98,
    authorName: 'Thanh Thảo',
    createdAt: '2026-10-15',
    tags: ['Phát âm', 'IPA', 'Speech'],
    comments: [
      {
        id: 'c3',
        authorName: 'Văn Hải',
        avatarText: 'VH',
        content: 'Ủng hộ 1 vote! Nhiều khi phát âm sai 1 âm đuôi mà không biết mình sai ở đâu.',
        createdAt: '2026-10-16 18:20',
      },
    ],
  },
  {
    id: 'feat-3',
    title: 'Tích hợp bộ đề thi thử TOEIC Format mới 200 câu',
    description: 'Mở rộng khu vực luyện thi có thêm bộ đề TOEIC 2 kỹ năng (Listening & Reading) chuẩn kỳ thi thật kèm đồng hồ bấm giờ.',
    category: 'luyen_thi',
    status: 'new', // MỚI
    upvotes: 76,
    authorName: 'Quốc Bảo',
    createdAt: '2026-10-22',
    tags: ['TOEIC', 'Đề thi thật'],
    comments: [],
  },
  {
    id: 'feat-4',
    title: 'Chế độ giao diện tương phản cao & Phông chữ OpenDyslexic',
    description: 'Hỗ trợ tuỳ chọn font chữ thân thiện cho người mắc chứng khó đọc và nâng cao độ tương phản màu sắc giúp đỡ mỏi mắt.',
    category: 'tien_ich',
    status: 'completed', // HOÀN THÀNH
    upvotes: 115,
    authorName: 'Đức Anh',
    createdAt: '2026-09-30',
    tags: ['Accessibility', 'A11y'],
    comments: [
      {
        id: 'c4',
        authorName: 'Bảo Ngọc',
        avatarText: 'BN',
        content: 'Tính năng rất nhân văn, cảm ơn đội ngũ phát triển!',
        createdAt: '2026-10-02 11:00',
      },
    ],
  },
  {
    id: 'feat-5',
    title: 'Thêm tính năng Chat AI tự động tạo bài viết hộ người học',
    description: 'Đề xuất thêm nút chatbot AI để tự động viết văn mẫu và dịch toàn bộ văn bản cho học viên mà không cần tự tư duy.',
    category: 'tien_ich',
    status: 'rejected', // TỪ CHỐI
    upvotes: 12,
    authorName: 'Người dùng ẩn danh',
    createdAt: '2026-10-05',
    tags: ['AI bot'],
    comments: [
      {
        id: 'c5',
        authorName: 'Đội ngũ LanguaLab',
        avatarText: 'LA',
        content: 'LanguaLab kiên định với triết lý rèn luyện tư duy ngôn ngữ trực tiếp và phản xạ tự thân của người học, không biến nền tảng thành công cụ "AI làm hộ". Do đó yêu cầu này xin phép từ chối.',
        createdAt: '2026-10-06 08:00',
      },
    ],
  },
]

export const useFeatureRequests = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  const isUseMock = computed(() => {
    return (
      config.public.useMock === true ||
      config.public.useMock === 'true' ||
      process.env.NUXT_PUBLIC_USE_MOCK === 'true'
    )
  })

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Danh sách yêu cầu
  const requests = ref<FeatureRequest[]>([...MOCK_FEATURE_REQUESTS_V2])
  const selectedStatus = ref<string>('all')
  const sortBy = ref<'votes' | 'newest'>('votes')

  // Trạng thái Admin thật từ cơ sở dữ liệu (qua RPC is_admin an toàn)
  const isAdmin = ref(false)

  // Kiểm tra quyền Admin
  const checkAdminRole = async () => {
    if (!authUser.value?.id || isUseMock.value) {
      isAdmin.value = false
      return
    }
    try {
      const { data, error } = await client.rpc('is_admin')
      if (!error && data !== null) {
        isAdmin.value = !!data
      }
    } catch {
      isAdmin.value = false
    }
  }

  // Tải danh sách yêu cầu từ View công khai feature_requests_public
  const fetchRequests = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      await checkAdminRole()
      const uid = authUser.value?.id

      // 1. Tải danh sách từ view bảo mật feature_requests_public
      const { data: publicRows, error: reqErr } = await client
        .from('feature_requests_public')
        .select('*')
        .order('vote_count', { ascending: false })

      if (reqErr) throw reqErr

      // 2. Lấy danh sách phiếu vote của người dùng hiện tại
      let userVotedIds = new Set<string>()
      if (uid) {
        const { data: votesData } = await client
          .from('feature_request_votes')
          .select('request_id')
          .eq('user_id', uid)

        if (votesData) {
          userVotedIds = new Set(votesData.map((v: any) => v.request_id))
        }
      }

      // 3. Lấy tất cả comments kèm profile tác giả
      const { data: commentsData } = await client
        .from('feature_request_comments')
        .select('*, profiles(full_name, avatar_text)')
        .order('created_at', { ascending: true })

      const commentsMap: Record<string, FeatureComment[]> = {}
      if (commentsData) {
        commentsData.forEach((c: any) => {
          if (!commentsMap[c.request_id]) commentsMap[c.request_id] = []
          const prof = c.profiles as any
          commentsMap[c.request_id].push({
            id: c.id,
            authorName: prof?.full_name || 'Học viên LanguaLab',
            avatarText: prof?.avatar_text || 'LA',
            content: c.content,
            createdAt: c.created_at ? c.created_at.replace('T', ' ').substring(0, 16) : '',
          })
        })
      }

      if (publicRows && publicRows.length > 0) {
        requests.value = publicRows.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category as FeatureCategory,
          status: r.status as FeatureStatus,
          upvotes: r.vote_count || 0,
          hasVoted: userVotedIds.has(r.id),
          authorName: r.author_name || 'Học viên',
          createdAt: r.created_at ? r.created_at.split('T')[0] : '',
          tags: Array.isArray(r.tags) ? r.tags : [],
          comments: commentsMap[r.id] || [],
        }))
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.warn('Lỗi khi tải yêu cầu tính năng từ Supabase, dùng mock fallback:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const savedVoted = localStorage.getItem('langua_voted_features')
      if (savedVoted) {
        try {
          const votedIds: string[] = JSON.parse(savedVoted)
          requests.value.forEach((r) => {
            if (votedIds.includes(r.id)) r.hasVoted = true
          })
        } catch {}
      }
    }
    fetchRequests()
  })

  // Toggle Upvote với Optimistic UI & Rollback khi lỗi
  const toggleUpvote = async (id: string) => {
    const item = requests.value.find(r => r.id === id)
    if (!item) return

    // 1. Optimistic Update ngay lập tức trên giao diện
    const prevVoted = !!item.hasVoted
    const prevUpvotes = item.upvotes
    item.hasVoted = !prevVoted
    item.upvotes += item.hasVoted ? 1 : -1

    const uid = authUser.value?.id

    // 2. Gọi RPC toggle_feature_vote lên Supabase nếu có đăng nhập
    if (!isUseMock.value && uid && !id.startsWith('feat-mock')) {
      try {
        const { data, error } = await client.rpc('toggle_feature_vote', {
          p_request_id: id,
        })

        if (error) {
          // Rollback nếu RPC lỗi
          item.hasVoted = prevVoted
          item.upvotes = prevUpvotes
          if (handleAuthExpired(error)) return
          alert(translateSupabaseError(error))
        } else if (data && typeof data === 'object') {
          const res = data as Record<string, any>
          item.hasVoted = res.has_voted
          item.upvotes = res.vote_count
        }
      } catch (err: any) {
        // Rollback
        item.hasVoted = prevVoted
        item.upvotes = prevUpvotes
        alert(translateSupabaseError(err))
      }
    } else if (import.meta.client) {
      const votedIds = requests.value.filter(r => r.hasVoted).map(r => r.id)
      localStorage.setItem('langua_voted_features', JSON.stringify(votedIds))
    }
  }

  // Gửi đề xuất mới
  const addRequest = async (data: { title: string; description: string; category: FeatureCategory }) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid) {
      try {
        const { data: newRow, error } = await client
          .from('feature_requests')
          .insert({
            user_id: uid,
            title: data.title,
            description: data.description,
            category: data.category,
            status: 'new',
          })
          .select()
          .single()

        if (error) throw error

        if (newRow) {
          // Tự vote cho bài của mình qua RPC
          await client.rpc('toggle_feature_vote', { p_request_id: newRow.id })

          const createdItem: FeatureRequest = {
            id: newRow.id,
            title: newRow.title,
            description: newRow.description,
            category: newRow.category as FeatureCategory,
            status: 'new',
            upvotes: 1,
            hasVoted: true,
            authorName: authUser.value?.user_metadata?.full_name || 'Bạn',
            createdAt: newRow.created_at.split('T')[0],
            tags: ['Đề xuất mới'],
            comments: [],
          }
          requests.value.unshift(createdItem)
          return createdItem
        }
      } catch (err: any) {
        if (handleAuthExpired(err)) throw new Error('Hết phiên đăng nhập')
        throw new Error(translateSupabaseError(err))
      }
    }

    // Local fallback
    const newReq: FeatureRequest = {
      id: `feat-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'new',
      upvotes: 1,
      hasVoted: true,
      authorName: 'Bạn (Người học)',
      createdAt: new Date().toISOString().split('T')[0],
      tags: ['Đề xuất mới'],
      comments: [],
    }

    requests.value.unshift(newReq)
    return newReq
  }

  // Thêm bình luận vào yêu cầu
  const addComment = async (requestId: string, content: string, authorName = 'Bạn') => {
    const item = requests.value.find(r => r.id === requestId)
    if (!item || !content.trim()) return

    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !requestId.startsWith('feat-mock')) {
      try {
        const { data: cRow, error } = await client
          .from('feature_request_comments')
          .insert({
            request_id: requestId,
            user_id: uid,
            content: content.trim(),
          })
          .select()
          .single()

        if (error) throw error

        if (cRow) {
          const newComment: FeatureComment = {
            id: cRow.id,
            authorName: authUser.value?.user_metadata?.full_name || authorName,
            avatarText: (authUser.value?.user_metadata?.full_name || authorName).substring(0, 2).toUpperCase(),
            content: cRow.content,
            createdAt: cRow.created_at.replace('T', ' ').substring(0, 16),
          }
          item.comments.push(newComment)
          return newComment
        }
      } catch (err: any) {
        if (handleAuthExpired(err)) throw new Error('Hết phiên đăng nhập')
        throw new Error(translateSupabaseError(err))
      }
    }

    // Local fallback
    const newComment: FeatureComment = {
      id: `comment-${Date.now()}`,
      authorName,
      avatarText: authorName.substring(0, 2).toUpperCase(),
      content: content.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    }

    item.comments.push(newComment)
    return newComment
  }

  // Admin cập nhật trạng thái yêu cầu
  const updateStatus = async (requestId: string, newStatus: FeatureStatus) => {
    if (!isAdmin.value) throw new Error('Chỉ Quản trị viên (Admin) mới có quyền đổi trạng thái yêu cầu.')

    const item = requests.value.find(r => r.id === requestId)
    if (item) item.status = newStatus

    if (!isUseMock.value) {
      try {
        const { error } = await client
          .from('feature_requests')
          .update({ status: newStatus })
          .eq('id', requestId)

        if (error) throw error
      } catch (err: any) {
        throw new Error(translateSupabaseError(err))
      }
    }
  }

  // Lấy chi tiết yêu cầu
  const getRequestById = (id: string): FeatureRequest | undefined => {
    return requests.value.find(r => r.id === id)
  }

  // Danh sách đã lọc và sắp xếp
  const filteredRequests = computed(() => {
    const list = requests.value.filter((r) => {
      return selectedStatus.value === 'all' || r.status === selectedStatus.value
    })

    if (sortBy.value === 'votes') {
      return list.sort((a, b) => b.upvotes - a.upvotes)
    } else {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  })

  return {
    requests,
    filteredRequests,
    selectedStatus,
    sortBy,
    isAdmin,
    isLoading,
    errorMessage,
    fetchRequests,
    toggleUpvote,
    addRequest,
    addComment,
    updateStatus,
    getRequestById,
  }
}
