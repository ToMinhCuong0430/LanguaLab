<script setup lang="ts">
import HomeDashboard from '~/components/home/HomeDashboard.vue'
import LandingPage from '~/components/landing/LandingPage.vue'

// Route "/" là callback của Supabase nên module không bắt đăng nhập ở đây (các route học khác vẫn bắt).
// Chưa có session: trang giới thiệu với layout landing (không navbar 8 mục, không footer app).
// Đã đăng nhập: trang học hiện tại với layout default.
definePageMeta({ layout: false })

const user = useSupabaseUser()
</script>

<template>
  <NuxtLayout v-if="user" name="default">
    <HomeDashboard />
  </NuxtLayout>
  <NuxtLayout v-else name="landing">
    <LandingPage />
  </NuxtLayout>
</template>
