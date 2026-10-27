<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    label?: string
    placeholder?: string
    type?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
    id?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
    disabled: false,
    required: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = computed(() => props.id || `input-${Math.random().toString(36).substring(2, 9)}`)

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="base-input-group" :class="{ 'base-input-group--error': !!error, 'base-input-group--disabled': disabled }">
    <label v-if="label" :for="inputId" class="base-input-group__label">
      {{ label }}
      <span v-if="required" class="text-bad" aria-hidden="true">*</span>
    </label>

    <div class="base-input-wrapper">
      <div v-if="$slots.prefix" class="base-input-affix base-input-affix--prefix">
        <slot name="prefix" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="base-input"
        @input="onInput"
      >

      <div v-if="$slots.suffix" class="base-input-affix base-input-affix--suffix">
        <slot name="suffix" />
      </div>
    </div>

    <p v-if="error" class="base-input-msg base-input-msg--error">
      {{ error }}
    </p>
    <p v-else-if="hint" class="base-input-msg base-input-msg--hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.base-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.base-input-group__label {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--ink);
}

.base-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--surface);
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.1s ease, transform 0.1s ease;
  overflow: hidden;
}

.base-input-wrapper:focus-within {
  box-shadow: var(--shadow);
  transform: translate(-1px, -1px);
}

.base-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  background: transparent;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 1rem;
  border: none;
  outline: none;
}

.base-input::placeholder {
  color: var(--ink-soft);
  opacity: 0.7;
}

.base-input-affix {
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  color: var(--ink-soft);
}

.base-input-msg {
  font-size: 0.8125rem;
  font-weight: 600;
  margin-top: 0.15rem;
}

.base-input-msg--error {
  color: var(--bad);
}

.base-input-msg--hint {
  color: var(--ink-soft);
}

.base-input-group--error .base-input-wrapper {
  border-color: var(--bad);
}

.base-input-group--disabled {
  opacity: 0.55;
}

.base-input-group--disabled .base-input-wrapper {
  cursor: not-allowed;
  box-shadow: none;
}
</style>
