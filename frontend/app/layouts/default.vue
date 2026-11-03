<script setup lang="ts">
import AppNavbar from '~/components/layout/AppNavbar.vue'
import WhatsNewModal from '~/components/common/WhatsNewModal.vue'
import { useFeatureColor } from '~/composables/useFeatureColor'
import { useWhatsNew } from '~/composables/useWhatsNew'

useFeatureColor()

const { checkAndShowOnMount } = useWhatsNew()
const { sidebarWidth } = useSidebar()

onMounted(() => {
  checkAndShowOnMount()
})
</script>

<template>
  <div class="layout-root">
    <AppNavbar />

    <main
      class="layout-main"
      :style="{ '--sidebar-w': sidebarWidth }"
    >
      <slot />
    </main>

    <ClientOnly>
      <WhatsNewModal />
    </ClientOnly>
  </div>
</template>

<style scoped>
.layout-root {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

.layout-main {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  margin-left: var(--sidebar-w, 64px);
  transition: margin-left 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow-x: hidden;
}
</style>
