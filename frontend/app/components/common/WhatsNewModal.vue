<script setup lang="ts">
import {
  BookOpen,
  Library,
  Hammer,
  ArrowRight,
  Check,
  Calendar,
  Layers,
} from '@lucide/vue'
import { BRAND_NAME } from '~/constants/brand'
import { useWhatsNew } from '~/composables/useWhatsNew'
import type { WhatsNewTag } from '~/constants/whatsNew'

const { isOpen, releasesToShow, isManualView, close } = useWhatsNew()

const iconComponents: Record<string, any> = {
  BookOpen,
  Library,
  Hammer,
  Layers,
}

const getTagBadge = (tag: WhatsNewTag) => {
  switch (tag) {
    case 'new':
      return { tone: 'ok' as const, label: 'Mới' }
    case 'improved':
      return { tone: 'accent' as const, label: 'Cải tiến' }
    case 'soon':
      return { tone: 'warn' as const, label: 'Sắp có' }
    default:
      return { tone: 'neutral' as const, label: 'Cập nhật' }
  }
}

const handleNavigate = (to?: string) => {
  if (to) {
    close()
    navigateTo(to)
  }
}
</script>

<template>
  <BaseModal
    v-model="isOpen"
    :title="`Có gì mới ở ${BRAND_NAME}`"
    max-width="lg"
    data-whats-new="true"
    @close="close"
  >
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      <div
        v-for="rel in releasesToShow"
        :key="rel.version"
        class="space-y-4 pb-4 border-b-2 border-line/40 last:border-b-0 last:pb-0"
      >
        <!-- Version header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-brut border-2 border-line bg-warn text-on-tone font-mono text-xs font-black shadow-brut-sm">
              v{{ rel.version }}
            </span>
            <h3 class="text-base font-black text-ink font-display">
              {{ rel.title }}
            </h3>
          </div>

          <span class="text-xs font-mono font-bold text-ink-soft inline-flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5" />
            <span>{{ rel.date }}</span>
          </span>
        </div>

        <!-- Release items list -->
        <div class="space-y-3">
          <div
            v-for="(item, idx) in rel.items"
            :key="idx"
            class="p-3.5 bg-surface-2 rounded-brut border-2 border-line shadow-brut-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3"
          >
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-brut border border-line bg-surface text-ink shrink-0 mt-0.5">
                <component
                  :is="iconComponents[item.icon] || BookOpen"
                  class="w-4 h-4 text-accent stroke-[2.5]"
                />
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="text-sm font-black text-ink font-display">
                    {{ item.title }}
                  </h4>
                  <BaseBadge
                    :tone="getTagBadge(item.tag).tone"
                    size="sm"
                  >
                    {{ getTagBadge(item.tag).label }}
                  </BaseBadge>
                </div>
                <p class="text-xs text-ink-soft leading-relaxed font-medium">
                  {{ item.description }}
                </p>
              </div>
            </div>

            <!-- Nút điều hướng nếu có to -->
            <button
              v-if="item.to"
              type="button"
              class="self-end sm:self-center px-3 py-1.5 min-h-[44px] rounded-brut border-2 border-line bg-surface hover:bg-warn text-ink font-black text-xs shadow-brut-sm cursor-pointer transition-colors inline-flex items-center gap-1 shrink-0"
              @click="handleNavigate(item.to)"
            >
              <span>Xem ngay</span>
              <ArrowRight class="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Action -->
    <div class="mt-6 pt-4 border-t-2 border-line flex items-center justify-between">
      <span class="text-[11px] text-ink-soft font-mono font-bold">
        {{ isManualView ? 'Lịch sử phát hành' : 'Phiên bản mới nhất' }}
      </span>

      <button
        type="button"
        class="px-5 py-2.5 min-h-[44px] rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs sm:text-sm shadow-brut cursor-pointer transition-transform active:translate-y-0.5 inline-flex items-center gap-1.5"
        @click="close"
      >
        <Check class="w-4 h-4 stroke-[3]" />
        <span>Đã hiểu</span>
      </button>
    </div>
  </BaseModal>
</template>
