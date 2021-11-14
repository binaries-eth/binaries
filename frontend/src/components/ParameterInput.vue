<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  modelValue: number
}>(), {
  // @ts-ignore
  modelValue: (): number => 1
})

const emit = defineEmits<{
  (e: 'update:modelValue', modelValue: number): void
}>()
</script>

<template>
  <div class="text-input">
    <label>{{ label }}</label>
    <input type="number" min="0" max="255" :value.number="modelValue" @input="emit('update:modelValue', parseInt(($event.target as HTMLInputElement).value))" />
    <input type="range" min="0" max="255" step="1" :value.number="modelValue" @input="emit('update:modelValue', parseInt(($event.target as HTMLInputElement).value))" />
  </div>
</template>

<style scoped>
.text-input {
  position: relative;
}
.text-input input[type="number"] {
  position: absolute;
  top: 14px;
  right: 10px;
  float: right;
}
</style>
