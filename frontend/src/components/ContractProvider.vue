<script lang="ts">
import { ethers, BigNumber } from "ethers"
import {
  Ref,
  watch,
  toRaw,
  toRefs,
  provide,
  computed,
  reactive,
  readonly,
  onMounted,
  onUnmounted,
} from "vue"
import { initMetamask } from "../lib/metamaskProvider"

const { formatEther } = ethers.utils

// const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as string // '0xa8A0d755b9466162672179570c548842Ecf5A47f'
const networkId = parseInt(import.meta.env.VITE_NETWORK_ID as string) // 42

const contractAbi = [
  "function name() view returns (string)",
  "function totalSupply() view returns (uint)",
  "function tokenByIndex(uint index) view returns (uint)",
  "function tokenMetadata(uint tokenId) view returns (tuple(address owner,address minter,string formula,uint8[] params,uint tokenId,uint sequence,uint burnPrice))",
  "function allTokensMetadata() view returns (tuple[](address owner,address minter,string formula,uint8[] params,uint tokenId,uint sequence,uint burnPrice))",
  "function tokenURI(uint tokenId) view returns (string)",
  "function mintPrice(uint totalSupply) view returns (uint)",
  "function burnPrice(uint sequence) view returns (uint)",
  "function mint(string formula, uint8[] params) payable returns (uint)",
  "function getClaimableBalance(address owner) view returns (uint)",
  "function burn(uint tokenId) returns (boolean)",
  "function claim() returns (boolean)",
]

type ContractCalls = {
  connect: () => void
  mint: (formula: string, params: number[], totalSupply: number) => Promise<number>
  burn: (tokenId: number) => Promise<void>
  claim: () => Promise<void>
  fetchTotalSupply: () => void
}

type TokenMetadata = {
  owner: string
  minter: string
  tokenId: number
  formula: string
  params: number[]
  image?: string
  sequence: number
  burnPrice: string
}

type ContractState = {
  totalSupply: number
  connected: boolean
  account: string
  accounts: string[]
  listing: TokenMetadata[]
  contractAddress: string
  signer?: ethers.providers.JsonRpcSigner
  network?: number
  validNetwork: boolean
  nextPrice: string
  providerError: string
  claimableBalance: string
}

type InsufficientFunds = {
  available: number
  required: number
}

const state: ContractState = reactive({
  totalSupply: 0,
  accounts: [],
  account: computed(() => state.accounts.length > 0 && state.accounts[0].toLowerCase() || ''),
  connected: computed(() => state.validNetwork && state.accounts.length > 0),
  contractAddress,
  signer: undefined,
  listing: [],
  network: 0,
  validNetwork: computed(() => !!state.network && state.network == networkId),
  nextPrice: '0',
  providerError: '',
  claimableBalance: '0',
})

// Infura
let infuraContract: ethers.Contract
const initInfura = () => {
  if (import.meta.env.VITE_INFURA_PROJECT_ID) {
    const infura = (new ethers.providers.InfuraProvider(networkId, import.meta.env.VITE_INFURA_PROJECT_ID))
    infuraContract = new ethers.Contract(contractAddress, contractAbi, infura)
  } else {
    infuraContract = new ethers.Contract(contractAddress, contractAbi, toRaw(state.signer))
  }
}

const fetchTokenMetadata = async (tokenId: number): Promise<TokenMetadata> => {
  let metadata = await infuraContract.tokenMetadata(tokenId).catch(handleVMException)
  return parseTokenMetadata(metadata)
}

const fetchMintPrice = async (totalSupply: number): Promise<string> => {
  const mintPrice = await infuraContract.mintPrice(totalSupply + 1)
  return formatEther(mintPrice)
}

watch(
  () => state.totalSupply,
  async (totalSupply: number, _) => {
    state.nextPrice = await fetchMintPrice(totalSupply)
  }
)

const fetchTotalSupply = async (): Promise<void> => {
  state.totalSupply = (await infuraContract.totalSupply()).toNumber()
}

const fetchClaimableBalance = async (account: string): Promise<string> => {
  return formatEther(await infuraContract.getClaimableBalance(account))
}

watch(
  () => state.account,
  async (account: string, _) => {
    if (account && account.length > 0) {
      state.claimableBalance = await fetchClaimableBalance(account)
    }
  }
)

const parseTokenMetadata = (metadata: any): TokenMetadata => {
  return {
    ...metadata,
    tokenId: metadata.tokenId.toNumber(),
    sequence: metadata.sequence.toNumber(),
    burnPrice: formatEther(metadata.burnPrice),
  }
}

const fetchListing = async (): Promise<void> => {
  const listing = await infuraContract.allTokensMetadata()
  state.listing = listing.map(parseTokenMetadata).sort((a: TokenMetadata,b: TokenMetadata) => a.tokenId > b.tokenId ? -1 : 1)
}

const mint = async (formula: string, params: number[] = [], totalSupply: Ref): Promise<number> => {
  const contract = new ethers.Contract(contractAddress, contractAbi, toRaw(state.signer))
  const value = await contract.mintPrice(totalSupply.value + 1)
  const mintReceipt = await (await contract.mint(formula, params, { value }).catch(handleVMException)).wait().catch(handleVMException)
  const tokenId = BigNumber.from(mintReceipt.logs[0].topics[3]).toNumber()
  handleMintedToken(tokenId)
  return tokenId
}

const burn = async (tokenId: number): Promise<void> => {
  const contract = new ethers.Contract(contractAddress, contractAbi, toRaw(state.signer))
  await (await contract.burn(tokenId).catch(handleVMException)).wait().catch(handleVMException)
  handleBurnedToken(tokenId)
}

const claim = async (): Promise<void> => {
  const contract = new ethers.Contract(contractAddress, contractAbi, toRaw(state.signer))
  await (await contract.claim().catch(handleVMException)).wait().catch(handleVMException)
}

const handleMintedToken = async (tokenId: number) => {
  let metadata = await fetchTokenMetadata(tokenId)
  state.listing.unshift(metadata)
  state.totalSupply += 1
}

const handleBurnedToken = (tokenId: number) => {
  state.listing = state.listing.filter((token) => token.tokenId != tokenId)
  state.totalSupply -= 1
}

const handleVMException = (error: any): Promise<never> => {
  let message: string = ''
  if (error.code == 4001) {
    message = 'Signature rejected'
  } else if (error.data.message && error.data.message.indexOf('(') > -1) { // we have a custom contract error
    message = error.data.message.match(/'(.*?)'/)[1]
    let errorClass = message.split('(')[0]
    let errorAttributes = message.match(/\((.*?)\)/)![1].replace(' ','').split(',')
    switch(errorClass) {
      case 'InsufficientFunds':
        message = parseInsufficientFunds({ available: parseInt(errorAttributes[0]), required: parseInt(errorAttributes[1]) } as InsufficientFunds)
    }
  }
  return Promise.reject(message)
}
const parseInsufficientFunds = (error: InsufficientFunds): string => {
  return `Transaction minumum amount ${error.required} ETH, sent ${error.available} ETH`
}

export const ContractStateSymbol = Symbol('Contract state provider identifier')
export const ContractUpdateSymbol = Symbol('Contract update provider identifier')
export const ContractCallsSymbol = Symbol('Contract calls provider identifier')
export { ContractCalls, ContractState, TokenMetadata }

export default {
  setup() {
    let metamask: any

    const connect = async (): Promise<void> => {
      try {
        await metamask.connect()
      } catch(err) {
        if ((err as any).code === 4001) {
          // user cancelled
          handleVMException(err)
        } else {
          console.log(err)
        }
      }
    }

    provide(ContractStateSymbol, toRefs(readonly(state)))
    provide(ContractCallsSymbol, { mint, burn, claim, connect, fetchTotalSupply })

    onMounted(async () => {
      try {
        metamask = await initMetamask(networkId)
      } catch(err) {
        state.providerError = err as string
      }

      if (metamask) {
        // check if already connected
        await metamask.checkConnection!()

        state.accounts =  metamask.accounts
        state.network = metamask.chainId
        state.signer = metamask.signer
      }
      initInfura()
      await fetchTotalSupply()
      await fetchListing()
    })

    onUnmounted(() => {
      if (metamask) {
        metamask.clearListeners()
      }
    })
  }
}
</script>

<template>
    <slot></slot>
</template>

<style scoped>
</style>
