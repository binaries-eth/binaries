import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat"

async function main() {
  const [_, funder] = await ethers.getSigners()
  const to = '0xDb34348D980Ee84eD69A991d18Bff73d4C78Cc15'

  await funder.sendTransaction({
    from: funder.address,
    to,
    value: parseEther("10")
  })

  console.log("ETH sent to:", to)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
