<script setup lang="ts">
import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { ContractStateSymbol, ContractState, TokenMetadata } from './ContractProvider.vue'
import TokenRenderer from './TokenRenderer.vue'

const emit = defineEmits<{
  (e: 'selected', item: TokenMetadata): void
}>()

const handleSelect = (item: TokenMetadata): void => {
  const clonedItem = JSON.parse(JSON.stringify(item)) as TokenMetadata
  emit('selected', clonedItem)
}

const { listing } = inject(ContractStateSymbol) as ContractState

onMounted(async () => {})
onUnmounted(() => {})
</script>

<template>
  <section>
    <div class="box" @click="handleSelect(item)" v-for="(item) in listing" :key="item.tokenId">
      <span class="shadow"></span>
      <TokenRenderer class="front" :scaled="true" :formula="item.formula" :params="item.params" :size="512" />
    </div>
  </section>
</template>

<style scoped>
section {
  display: flex;
  gap: 64px;
  flex-wrap: wrap;
  justify-content: center;
}
.box {
  position: relative;
}
.box:hover {
  cursor: pointer;
}
.front {
  display: block;
  position: relative;
  transition:
    transform 600ms cubic-bezier(.3, .7, .4, 1);
}
.shadow {
  position: absolute;
  will-change: transform;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: hsl(52, 66%, 43%);
  display: block;
  transition: transform 400ms cubic-bezier(.3, .7, .4, 1);
  box-shadow:
    1px 2px 2px hsl(52, 66%, 43%),
    2px 4px 4px hsl(52, 66%, 43%),
    4px 8px 8px hsl(52, 66%, 43%),
    8px 16px 16px hsl(52, 66%, 43%);
}
.box:hover .front {
  transform: translateY(-2px);
  transition:
    transform 250ms cubic-bezier(.3, .7, .4, 1.5);
}

.box:hover .shadow {
  transform: translateY(1px);
}
</style>
