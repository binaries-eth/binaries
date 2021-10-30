<script setup lang="ts">
import { ref, unref, inject, watch, computed, onMounted, onUnmounted } from '@vue/runtime-core'
import FormulaInput from './FormulaInput.vue'
import ParameterInput from './ParameterInput.vue'
import MintButton from './MintButton.vue'
import { ContractStateSymbol, ContractCallsSymbol, ContractCalls, ContractState, TokenMetadata } from './ContractProvider.vue'
import { sanitizeFormula } from '../lib/inputSanitation'

const { mint, burn, connect, fetchTotalSupply } = inject(ContractCallsSymbol) as ContractCalls
const { account, connected, totalSupply, nextPrice, listing, providerError } = inject(ContractStateSymbol) as ContractState

const props = defineProps<{
  formulaValue: string
  paramsValues: number[]
}>()

const emit = defineEmits<{
  (e: 'update:formulaValue', formula: string): void
  (e: 'update:paramsValues', params: number[]): void
}>()

const formulaValue = computed({
  get: () => props.formulaValue,
  set: (val) => emit('update:formulaValue', val),
})

const current = ref({} as TokenMetadata)
const disabled = computed(() => !!current.value)
const minting = ref(false)
const errorMessage = ref('')
const currentOwner = computed(() => current.value && current.value.owner && current.value.owner.toLowerCase())

const getParamsLength = (formula: string): number => {
  return formula.match(/p[0-9]+/g)?.filter((x, i, a) => a.indexOf(x) == i)?.length || 0
}

const uniqueHashes = computed(() => Object.fromEntries(unref(listing).map((i) => [[i.formula, ...i.params].join(','),i])))

const findOwnership = (attrs: (string|number)[]): TokenMetadata => {
  return uniqueHashes.value[attrs.join(',')]
}

const stopWatching = watch(() => [props.formulaValue, ...props.paramsValues], (newParams, _) => {
  const newLength = getParamsLength(newParams[0] as string)
  if (newLength != props.paramsValues.length) {
    props.paramsValues.length += newLength - props.paramsValues.length
    emit('update:paramsValues', Array.apply(null, props.paramsValues).map(v => v || 1) as number[])
  }
  current.value = findOwnership(newParams)
})

watch(() => uniqueHashes.value, () => {
  current.value = findOwnership([props.formulaValue, ...props.paramsValues])
})

const handleMint = async (): Promise<void> => {
  minting.value = true
  const f = sanitizeFormula(props.formulaValue)
  const p = props.paramsValues
  await mint(f,p,totalSupply).catch(displayError)
  minting.value = false
}

const displayError = async (error: string) => {
  errorMessage.value = error
}

const clearError = () => {
  errorMessage.value = ''
}

const getRandomInt = (max: number): number => Math.floor(Math.random() * max)

const randomiseParams = () => {
  emit('update:paramsValues', props.paramsValues.map(() => getRandomInt(255)))
}

onMounted(async () => {})

onUnmounted(() => {
  stopWatching()
})
</script>

<template>
  <div>
    <FormulaInput v-model="formulaValue" />
    <ParameterInput :label="'P' + (index+1)" v-model.number="paramsValues[index]" v-for="(_, index) in paramsValues" />
    <div class="center">
      <span v-if="disabled">These params are already minted </span>
      <span class="link" @click="randomiseParams()">(randomise)</span>
    </div>
    <div class="center">
      Current price <span class="price">{{nextPrice}}Ξ </span>
      <span class="link" @click="fetchTotalSupply()">(refresh)</span> 
      <a href="https://github.com/binaries-eth/binaries#tokenomics" class="link">(tokenomics info)</a>
    </div>
    <div class="button-container">
      <MintButton :disabled="disabled || minting" :minting="minting" v-if="connected" @click="handleMint()" />
      <span v-else-if="!providerError" class="link" @click="connect()">(connect)</span>
      <a href="https://metamask.io" target="_blank" v-else-if="providerError">(install Metamask 🦊 to mint)</a>
    </div>
    <div v-if="currentOwner == account" class="center">
      <span class="link" @click="burn(current.tokenId)">(burn for {{ current.burnPrice }}Ξ)</span>
    </div>
    <div v-if="errorMessage" class="center">
      <span class="error">{{ errorMessage }}</span>
      <span class="link" @click="clearError()"> (OK, close)</span>
    </div>
  </div>
</template>

<style scoped>
.center {
  text-align: center;
}
.price {
  font-weight: 500;
}
.error {
  color: magenta;
  font-weight: 500;
}
.button-container {
  display: flex;
  justify-content: center;
}
</style>
