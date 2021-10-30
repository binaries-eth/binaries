<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', modelValue: string): void
}>()

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key.match(/[^ \[\]a-zA-Z0-9=<>*+-\/().&^!|%;?:]/)?.length) {
    event.preventDefault()
  }
}

const handleInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="text-input">
    <label>forumla</label>
    <input type="text" :value="modelValue" @keydown="handleKeydown($event)" @input="handleInput($event)" />
  </div>
</template>

<style scoped>

</style>
