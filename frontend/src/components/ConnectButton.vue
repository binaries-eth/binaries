<script setup lang="ts">
import { ContractStateSymbol, ContractCallsSymbol, ContractCalls, ContractState } from './ContractProvider.vue'
import { inject } from 'vue'

const { connect, claim } = inject(ContractCallsSymbol) as ContractCalls
const { connected, account, providerError, claimableBalance } = inject(ContractStateSymbol) as ContractState
</script>

<template>
  <div>
    <div v-if="providerError">{{ providerError }}</div>
    <div v-else>
      <button v-if="!connected" @click="connect()" ref="connect_button">CONNECT</button>
      <div v-else>
        <span class="with_space">
          Accrued <span class="amount">{{ claimableBalance }}Ξ </span>
          <span class="link" @click="claim()">(claim)</span>
        </span>
        <span>Connected as {{ account }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.with_space {
  padding-right: 1em;
}
.amount {
  font-weight: 500;
}
</style>
