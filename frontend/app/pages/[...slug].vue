<script setup lang="ts">
// Bắt tất cả các đường dẫn không tồn tại và ném lỗi 404 chuẩn của Nuxt
throw createError({
  statusCode: 404,
  statusMessage: 'Trang không tồn tại',
  fatal: true,
})
</script>

<template>
  <div />
</template>
