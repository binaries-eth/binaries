<script setup lang="ts">
import { ref } from 'vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import TokenRenderer from './components/TokenRenderer.vue'
import TokenForm from './components/TokenForm.vue'
import ConnectButton from './components/ConnectButton.vue'
import ContractProvider from './components/ContractProvider.vue'
import TokenList from './components/TokenList.vue'
import { TokenMetadata } from './components/ContractProvider.vue'

const size = 512
const f = ref("!((x ^ y) % p1)")
const p = ref([7])
const connected = ref(false)

const handleConnected = (value: boolean): void => {
  connected.value = value
}

const handleSelect = (item: TokenMetadata): void => {
  f.value = item.formula
  p.value = item.params
}
</script>

<template>
  <ContractProvider>
    <div class="navigation">
      <span class="logo">BINARIES</span>
      <ConnectButton @connected="handleConnected" />
    </div>
    <div class="grid">
      <TokenRenderer class="shadow" :formula="f" :params="p" :size="size" />
      <TokenForm class="editor" v-model:formula-value="f" v-model:params-values="p" :connected="connected" />
    </div>
    <TokenList @selected="handleSelect" />
  </ContractProvider>
</template>

<style scoped>
  .logo {
    font-weight: 500;
  }
  .container {
    
  }
  .shadow {
    border-radius: 8px;
    /* box-shadow:
      0px 0px 8px hsl(0, 0%, 30%),
      0px 0px 16px hsl(0, 0%, 20%),
      0px 0px 32px hsl(0, 0%, 10%),
      0px 0px 64px hsl(0, 0%, 1%); */
    /* box-shadow:
      1px 2px 2px hsl(0, 0%, 94%),
      2px 4px 4px hsl(52, 66%, 43%),
      4px 8px 8px hsl(52, 66%, 43%),
      8px 16px 16px hsl(52, 66%, 43%); */
  }
  .navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    margin-bottom: 50px;
    padding: 16px 0px;
    max-width: 1256px;
    margin-left: auto;
    margin-right: auto;
  }
  .grid {
    display: flex;
    justify-content: center;
    align-items: flex-start;

    gap: 64px;
    margin-bottom: 80px;
  }
  .editor {
    max-width: 400px;
    display: flex;
    flex-direction: column;
    /* align-self: flex-start;
    gap: 24px; */
    flex-grow: 1;
  }
  .logo {
    background-color: transparent;
  }
</style>
