<script setup lang="ts">
import ImportWizard from '~/components/admin/ImportWizard.vue'
import type { ContentType } from '~/components/admin/importTypes'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({
  title: 'Nhập nội dung học tập - Langua Admin',
})

const route = useRoute()
const initialType = computed<ContentType>(() => {
  const t = route.query.type as string
  if (['vocab', 'typing', 'grammar', 'reading', 'media', 'dictionary', 'ielts'].includes(t)) {
    return t as ContentType
  }
  return 'vocab'
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <PageBanner
      title="Trình nạp dữ liệu học tập (Import Wizard)"
      description="Nạp dữ liệu hàng loạt từ file CSV hoặc JSON với quy trình 4 bước kiểm tra lỗi nghiêm ngặt."
      badge-text="Data Import"
      feature="admin"
    />

    <ImportWizard :initial-type="initialType" />
  </div>
</template>
