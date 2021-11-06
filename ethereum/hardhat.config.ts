import { task } from "hardhat/config"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan"
import "hardhat-gas-reporter"
import * as dotenv from 'dotenv'
dotenv.config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const { INFURA_PROJECT_ID, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env

const solidity = {
  version: "0.8.7",
  settings: {
    optimizer: {
      enabled: true,
      runs: 10,
    },
  },
}

const networks = {
  mainnet: {
    url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    chainId: 1,
    accounts: [`0x${DEPLOYER_PRIVATE_KEY}`],
    gasPrice: 83000000000,
  },
  kovan: {
    url: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
    chainId: 42,
    accounts: [`0x${DEPLOYER_PRIVATE_KEY}`],
  },
}

const etherscan = {
  apiKey: `${ETHERSCAN_API_KEY}`
}

export { solidity, networks, etherscan }
