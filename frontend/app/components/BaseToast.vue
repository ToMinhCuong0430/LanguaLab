<script setup lang="ts">
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from '@lucide/vue'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    tone?: ToastTone
    title?: string
    message: string
    duration?: number
    dismissible?: boolean
  }>(),
  {
    modelValue: true,
    tone: 'info',
    title: '',
    duration: 4000,
    dismissible: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

let timer: any = null

onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(close, props.duration)
  }
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <Transition name="base-toast">
    <div
      v-if="modelValue"
      class="base-toast"
      :class="`base-toast--${tone}`"
      role="status"
      aria-live="polite"
    >
      <div class="base-toast__icon">
        <component :is="iconMap[tone]" class="w-5 h-5 stroke-[2.5]" />
      </div>

      <div class="base-toast__content">
        <h4 v-if="title" class="base-toast__title">{{ title }}</h4>
        <p class="base-toast__msg">{{ message }}</p>
      </div>

      <button
        v-if="dismissible"
        type="button"
        class="base-toast__close"
        aria-label="Đóng thông báo"
        @click="close"
      >
        <X class="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.base-toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: var(--surface);
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  max-width: 24rem;
  min-width: 18rem;
  color: var(--ink);
}

.base-toast--success {
  border-left: 6px solid var(--ok);
}
.base-toast--success .base-toast__icon {
  color: var(--ok);
}

.base-toast--error {
  border-left: 6px solid var(--bad);
}
.base-toast--error .base-toast__icon {
  color: var(--bad);
}

.base-toast--warning {
  border-left: 6px solid var(--warn);
}
.base-toast--warning .base-toast__icon {
  color: var(--c-yellow-ink);
}

.base-toast--info {
  border-left: 6px solid var(--c-blue);
}
.base-toast--info .base-toast__icon {
  color: var(--c-blue);
}

.base-toast__content {
  flex: 1;
  min-width: 0;
}

.base-toast__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.875rem;
  margin-bottom: 0.15rem;
}

.base-toast__msg {
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--ink-soft);
}

.base-toast__close {
  padding: 0.2rem;
  border-radius: var(--radius);
  cursor: pointer;
  background: transparent;
  color: var(--ink-soft);
  border: 1px solid transparent;
  transition: all 0.1s ease;
}

.base-toast__close:hover {
  background: var(--surface-2);
  color: var(--ink);
  border-color: var(--line);
}

/* Transitions */
.base-toast-enter-active,
.base-toast-leave-active {
  transition: all 0.2s ease;
}

.base-toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

.base-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
