<script setup lang="ts">
import { X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    closeOnBackdrop?: boolean
  }>(),
  {
    title: '',
    maxWidth: 'md',
    closeOnBackdrop: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const onBackdropClick = (e: MouseEvent) => {
  if (props.closeOnBackdrop && e.target === e.currentTarget) {
    close()
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="base-modal">
      <div
        v-if="modelValue"
        class="base-modal-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Hộp thoại'"
        @click="onBackdropClick"
      >
        <div
          class="base-modal-container"
          :class="`base-modal-container--${maxWidth}`"
        >
          <!-- Header -->
          <header v-if="title || $slots.header" class="base-modal-header">
            <slot name="header">
              <h2 class="base-modal-title">{{ title }}</h2>
            </slot>
            <button
              type="button"
              class="base-modal-close"
              aria-label="Đóng hộp thoại"
              @click="close"
            >
              <X class="w-5 h-5 stroke-[2.5]" />
            </button>
          </header>

          <!-- Body -->
          <div class="base-modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="base-modal-footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.base-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.base-modal-container {
  width: 100%;
  background: var(--surface);
  color: var(--ink);
  border: var(--bw) solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
}

.base-modal-container--sm { max-width: 24rem; }
.base-modal-container--md { max-width: 32rem; }
.base-modal-container--lg { max-width: 42rem; }
.base-modal-container--xl { max-width: 52rem; }
.base-modal-container--2xl { max-width: 64rem; }

.base-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: var(--bw) solid var(--line);
  background: var(--surface-2);
}

.base-modal-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.125rem;
  line-height: 1.2;
}

.base-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.08s ease, background 0.15s ease;
}

.base-modal-close:hover {
  background: var(--bad);
  color: #FFFFFF;
  transform: translate(1px, 1px);
}

.base-modal-close:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.base-modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.base-modal-footer {
  padding: 0.85rem 1.25rem;
  border-top: var(--bw) solid var(--line);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Transitions */
.base-modal-enter-active,
.base-modal-leave-active {
  transition: opacity 0.15s ease;
}

.base-modal-enter-from,
.base-modal-leave-to {
  opacity: 0;
}

.base-modal-enter-active .base-modal-container,
.base-modal-leave-active .base-modal-container {
  transition: transform 0.15s ease;
}

.base-modal-enter-from .base-modal-container,
.base-modal-leave-to .base-modal-container {
  transform: scale(0.96) translateY(8px);
}
</style>
