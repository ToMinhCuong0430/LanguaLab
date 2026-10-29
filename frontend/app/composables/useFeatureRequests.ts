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

export const useFeatureRequests = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Danh sách yêu cầu (Đọc trực tiếp từ cơ sở dữ liệu thật)
  const requests = ref<FeatureRequest[]>([])
  const selectedStatus = ref<string>('all')
  const sortBy = ref<'votes' | 'newest'>('votes')

  // Trạng thái Admin thật từ cơ sở dữ liệu (qua RPC is_admin an toàn)
  const isAdmin = ref(false)

  // Kiểm tra quyền Admin
  const checkAdminRole = async () => {
    if (!authUser.value?.id) {
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

      if (!publicRows || publicRows.length === 0) {
        requests.value = []
        return
      }

      // 2. Lấy danh sách request_id mà user đã vote (nếu đã đăng nhập)
      let userVotedIds = new Set<string>()
      if (uid) {
        const { data: voteRows } = await client
          .from('feature_request_votes')
          .select('request_id')
          .eq('user_id', uid)

        if (voteRows) {
          userVotedIds = new Set(voteRows.map((v) => v.request_id))
        }
      }

      // 3. Tải bình luận cho các yêu cầu
      const requestIds = publicRows.map((r) => r.id)
      const { data: commentsData } = await client
        .from('feature_request_comments')
        .select('*, profiles(full_name, avatar_text)')
        .in('request_id', requestIds)
        .order('created_at', { ascending: true })

      const commentsByReqId: Record<string, FeatureComment[]> = {}
      ;(commentsData || []).forEach((c: any) => {
        if (!commentsByReqId[c.request_id]) commentsByReqId[c.request_id] = []
        const author = c.profiles?.full_name || 'Người dùng ẩn danh'
        commentsByReqId[c.request_id].push({
          id: c.id,
          authorName: author,
          avatarText: c.profiles?.avatar_text || author.substring(0, 2).toUpperCase(),
          content: c.content,
          createdAt: c.created_at ? c.created_at.replace('T', ' ').substring(0, 16) : '',
        })
      })

      // 4. Map thành mảng FeatureRequest hoàn chỉnh
      requests.value = publicRows.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description || '',
        category: (r.category as FeatureCategory) || 'tien_ich',
        status: (r.status as FeatureStatus) || 'new',
        upvotes: r.vote_count || 0,
        hasVoted: userVotedIds.has(r.id),
        authorName: r.author_name || 'Người dùng',
        createdAt: r.created_at ? r.created_at.split('T')[0] : '',
        tags: r.category ? [r.category] : [],
        comments: commentsByReqId[r.id] || [],
      }))
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.error('Lỗi khi tải yêu cầu tính năng từ Supabase:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchRequests()
  })

  // Thả tim / vote yêu cầu qua RPC server an toàn
  const toggleVote = async (id: string) => {
    const item = requests.value.find((r) => r.id === id)
    if (!item) return

    const uid = authUser.value?.id
    if (!uid) {
      alert('Vui lòng đăng nhập để bình chọn tính năng!')
      return
    }

    // Optimistic UI update
    const prevVoted = item.hasVoted
    const prevUpvotes = item.upvotes
    item.hasVoted = !item.hasVoted
    item.upvotes += item.hasVoted ? 1 : -1

    try {
      const { data, error } = await client.rpc('toggle_feature_vote', {
        p_request_id: id,
      })

      if (error) {
        // Rollback nếu lỗi
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
      item.hasVoted = prevVoted
      item.upvotes = prevUpvotes
      alert(translateSupabaseError(err))
    }
  }

  // Gửi đề xuất mới
  const addRequest = async (data: { title: string; description: string; category: FeatureCategory }) => {
    const uid = authUser.value?.id
    if (!uid) {
      throw new Error('Vui lòng đăng nhập để gửi đề xuất tính năng')
    }

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

        // Tải lại danh sách
        await fetchRequests()

        return newRow
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) throw new Error('Hết phiên đăng nhập')
      throw new Error(translateSupabaseError(err))
    }
  }

  // Thêm bình luận vào yêu cầu
  const addComment = async (requestId: string, content: string, authorName = 'Bạn') => {
    const item = requests.value.find((r) => r.id === requestId)
    if (!item || !content.trim()) return

    const uid = authUser.value?.id
    if (!uid) {
      throw new Error('Vui lòng đăng nhập để gửi bình luận')
    }

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
          createdAt: cRow.created_at ? cRow.created_at.replace('T', ' ').substring(0, 16) : '',
        }
        item.comments.push(newComment)
        return newComment
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) throw new Error('Hết phiên đăng nhập')
      throw new Error(translateSupabaseError(err))
    }
  }

  // Admin cập nhật trạng thái yêu cầu
  const updateStatus = async (requestId: string, newStatus: FeatureStatus) => {
    if (!isAdmin.value) throw new Error('Chỉ Quản trị viên (Admin) mới có quyền đổi trạng thái yêu cầu.')

    const item = requests.value.find((r) => r.id === requestId)
    if (item) item.status = newStatus

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

  // Lấy chi tiết yêu cầu
  const getRequestById = (id: string): FeatureRequest | undefined => {
    return requests.value.find((r) => r.id === id)
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
    selectedStatus,
    sortBy,
    isLoading,
    errorMessage,
    isAdmin,
    filteredRequests,
    fetchRequests,
    toggleVote,
    addRequest,
    addComment,
    updateStatus,
    getRequestById,
  }
}
