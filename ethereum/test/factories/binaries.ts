import { ethers } from "hardhat"

const deployedToken = async () => {
  const Token = await ethers.getContractFactory("Binaries")
  const token = await Token.deploy()
  await token.deployed()

  return token
}

export { deployedToken }
