<script setup lang="ts">
import AppNavbar from '~/components/layout/AppNavbar.vue'
import AppFooter from '~/components/layout/AppFooter.vue'
import { useFeatureColor } from '~/composables/useFeatureColor'

useFeatureColor()
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg text-ink pb-12 sm:pb-0">
    <AppNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
