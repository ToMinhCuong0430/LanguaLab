<script setup lang="ts">
import AppNavbar from '~/components/layout/AppNavbar.vue'
import AppFooter from '~/components/layout/AppFooter.vue'
import WhatsNewModal from '~/components/common/WhatsNewModal.vue'
import { useFeatureColor } from '~/composables/useFeatureColor'
import { useWhatsNew } from '~/composables/useWhatsNew'

useFeatureColor()

const { checkAndShowOnMount } = useWhatsNew()

onMounted(() => {
  checkAndShowOnMount()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-bg text-ink pb-12 sm:pb-0">
    <AppNavbar />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <ClientOnly>
      <WhatsNewModal />
    </ClientOnly>
  </div>
</template>
