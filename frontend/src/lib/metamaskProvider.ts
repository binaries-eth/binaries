// Initialization of Metamask interface

import { ethers } from "ethers"
import { ref, Ref } from "vue"

interface Connector {
  signer: Ref<ethers.providers.JsonRpcSigner>
  accounts: Ref<string[]>
  chainId: Ref<number>
  connect: Function
  checkConnection?: Function
  clearListeners?: Function
}

const initMetamask = async (requestedChainId: number): Promise<Connector> => {
  // Metamask injected RPC provider
  const ethereum =
    (window as any).ethereum ||
    ((window as any).web3 && (window as any).web3.currentProvider)

  if (ethereum) {
    const metamask = (new ethers.providers.Web3Provider(ethereum, 'any'))

    // When user is initiating network change 
    metamask.on('network', (n, o) => {
      handleNetworkChange(n.chainId)
    })

    const signer = ref({} as ethers.providers.JsonRpcSigner)
    const accounts = ref([] as string[])
    const chainId = ref(0)

    const handleChangedAccounts = (newAccounts: string[]): void => {
      accounts.value = newAccounts
      signer.value = metamask.getSigner()
    }

    const handleNetworkChange = (newChain: number): void => {
      chainId.value = newChain
    }

    ethereum.on('accountsChanged', handleChangedAccounts)

    const checkConnection = async (): Promise<void> => {
      handleChangedAccounts(await metamask.listAccounts())
    }

    const connect = async (): Promise<void> => {
      // Switch to right network
      if (chainId.value != requestedChainId) {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + requestedChainId.toString(16) }]
        })
      }

      // Check if already connected
      checkConnection()

      // Request to connect
      if (accounts.value.length == 0) {
        await ethereum.request({ method: 'eth_requestAccounts' })
      }
    }

    const clearListeners = (): void => {
      ethereum.removeListener('accountsChanged', handleChangedAccounts)
    }

    return { signer, chainId, accounts, connect, checkConnection, clearListeners }
  } else {
    return Promise.reject('For a start only Metamask 🦊')
  }
}

export { initMetamask, Connector }
