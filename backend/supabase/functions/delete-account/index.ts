import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

/**
 * Xóa đệ quy toàn bộ file trong một bucket thuộc thư mục của người dùng
 */
async function deleteFolderInBucket(adminClient: any, bucketName: string, prefix: string) {
  try {
    let offset = 0
    const limit = 100
    let hasMore = true

    while (hasMore) {
      const { data: files, error: listError } = await adminClient.storage
        .from(bucketName)
        .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } })

      if (listError) {
        console.error(`[delete-account] Lỗi khi liệt kê file trong bucket ${bucketName}/${prefix}:`, listError.message)
        break
      }

      if (!files || files.length === 0) {
        break
      }

      const filePaths = files
        .filter((f: any) => f.name !== '.emptyFolderPlaceholder')
        .map((f: any) => `${prefix}/${f.name}`)

      if (filePaths.length > 0) {
        const { error: removeError } = await adminClient.storage
          .from(bucketName)
          .remove(filePaths)

        if (removeError) {
          console.error(`[delete-account] Lỗi khi xóa file trong bucket ${bucketName}:`, removeError.message)
        } else {
          console.log(`[delete-account] Đã xóa ${filePaths.length} file trong ${bucketName}/${prefix}`)
        }
      }

      if (files.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }
  } catch (err: any) {
    console.error(`[delete-account] Ngoại lệ khi dọn dẹp storage bucket ${bucketName}:`, err.message)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing authorization' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Xác định người gọi từ JWT của chính họ (đảm bảo tính toàn vẹn)
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

  const userId = user.id
  const admin = createClient(url, serviceKey)

  // 2. Dùng service role dọn dẹp file trong bucket `avatars` và `speaking-recordings` dưới {user_id}/
  // Lưu ý: Lỗi khi xóa file trong storage KHÔNG được chặn quá trình xóa tài khoản
  await Promise.allSettled([
    deleteFolderInBucket(admin, 'avatars', userId),
    deleteFolderInBucket(admin, 'speaking-recordings', userId),
    deleteFolderInBucket(admin, 'pronunciation-recordings', userId),
  ])

  // 3. Xoá đúng tài khoản của người gọi khỏi auth.users
  // (Các bảng tham chiếu như profiles, exam_attempts sẽ tự CASCADE theo schema)
  const { error: delErr } = await admin.auth.admin.deleteUser(userId)
  if (delErr) {
    console.error('[delete-account] Lỗi khi gọi deleteUser:', delErr.message)
    return json({ error: delErr.message }, 500)
  }

  return json({ ok: true })
})
