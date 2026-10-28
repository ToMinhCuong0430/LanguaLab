<script setup lang="ts">
import { X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    closeOnBackdrop?: boolean
    closeOnEsc?: boolean
    showCloseButton?: boolean
  }>(),
  {
    title: '',
    maxWidth: 'md',
    closeOnBackdrop: true,
    closeOnEsc: true,
    showCloseButton: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const modalContainerRef = ref<HTMLElement | null>(null)
const titleId = `modal-title-${Math.random().toString(36).substring(2, 9)}`
let previousActiveElement: HTMLElement | null = null

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
  if (!props.modelValue) return

  if (e.key === 'Escape') {
    if (props.closeOnEsc) {
      e.preventDefault()
      close()
    }
    return
  }

  // Focus trap
  if (e.key === 'Tab' && modalContainerRef.value) {
    const focusables = modalContainerRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    if (!focusables.length) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!import.meta.client) return
    if (isOpen) {
      previousActiveElement = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown)
      nextTick(() => {
        const firstFocusable = modalContainerRef.value?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (firstFocusable) {
          firstFocusable.focus()
        } else {
          modalContainerRef.value?.focus()
        }
      })
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
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
        :aria-labelledby="title ? titleId : undefined"
        :aria-label="!title ? 'Hộp thoại' : undefined"
        @click="onBackdropClick"
      >
        <div
          ref="modalContainerRef"
          class="base-modal-container"
          :class="`base-modal-container--${maxWidth}`"
          tabindex="-1"
        >
          <!-- Header -->
          <header v-if="title || $slots.header" class="base-modal-header">
            <slot name="header">
              <h2 :id="titleId" class="base-modal-title">{{ title }}</h2>
            </slot>
            <button
              v-if="showCloseButton"
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
  background-color: rgba(17, 20, 29, 0.5);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius);
  border: 2px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.08s ease, background 0.15s ease;
}

.base-modal-close:hover {
  background: var(--bad);
  color: var(--on-tone, #ffffff);
  transform: translate(1px, 1px);
}

.base-modal-close:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.base-modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.base-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-top: 2px solid var(--line);
  background: var(--surface-2);
}

/* Animations */
.base-modal-enter-active,
.base-modal-leave-active {
  transition: opacity 0.18s ease;
}

.base-modal-enter-active .base-modal-container,
.base-modal-leave-active .base-modal-container {
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease;
}

.base-modal-enter-from,
.base-modal-leave-to {
  opacity: 0;
}

.base-modal-enter-from .base-modal-container,
.base-modal-leave-to .base-modal-container {
  opacity: 0;
  transform: scale(0.96) translateY(6px);
}
</style>
