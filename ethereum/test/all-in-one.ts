import { expect } from "chai"
import { ethers } from "hardhat"
import { BigNumber } from "@ethersproject/bignumber"
import { deployedToken } from "./factories/binaries"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

const { parseEther, formatEther } = ethers.utils

describe("Binaries", function() {
  let token: any
  let owner: SignerWithAddress
  let eoa: SignerWithAddress

  before(async () => {
    [owner, eoa] = (await ethers.getSigners())
    token = await deployedToken()
  })

  const mint = async (forumla: string, params: number[] = [], account: SignerWithAddress = owner): Promise<BigNumber> => {
    const currentSupply = parseInt(await token.totalSupply())
    const value = await token.mintPrice(currentSupply + 1)
    const mintReceipt = await (await token.connect(account).mint(forumla, params, { value })).wait()
    const tokenId = BigNumber.from(mintReceipt.logs[0].topics[3])

    return tokenId
  }

  describe("Pausable", () => {
    it("has a public variable", async () => {
      expect(await token.paused()).to.eq(0)
    })

    it("is possible to pause", async () => {
      await token.pause()
      expect(await token.paused()).to.eq(1)
    })

    it("is possible to unpause", async () => {
      await token.pause()
      await token.unpause()
      expect(await token.paused()).to.eq(0)
    })
  })

  describe("Refundable", () => {
    beforeEach(async () => {
      token = await deployedToken()
    })

    it("has a public variable", async () => {
      expect(await token.refundable()).to.eq(0)
    })

    it("setting fails if not paused", async () => {
      await expect(token.makeRefundable()).to.be.reverted
    })

    it("can only be set when paused", async () => {
      await token.pause()
      await token.makeRefundable()
      expect(await token.refundable()).to.eq(1)
    })

    it("allows users to claim their whole balance", async() => {
      await mint('f')
      await mint('f')
      await mint('f')
      await mint('f', [], eoa)
      await mint('f', [], eoa)
      await mint('f', [], eoa)
      await token.pause()
      await token.makeRefundable()
      await token.claimRefund()
      await token.connect(eoa).claimRefund()
      await token.withdraw()
      const balance = await token.getBalance()
      expect(balance).to.eq(0)
    })
  })

  describe("Price as x^2/2^10", () => {
    it("when 16", async () => {
      expect(await token.mintPrice(16)).to.equal(parseEther("0.25"))
    })

    it("when 64", async () => {
      expect(await token.mintPrice(64)).to.equal(parseEther("4"))
    })

    it("when 128", async () => {
      expect(await token.mintPrice(128)).to.equal(parseEther("16"))
    })

    it("when 160", async () => {
      expect(await token.mintPrice(160)).to.equal(parseEther("25"))
    })

    it("when 8 burned", async () => {
      expect(await token.burnPrice(8)).to.equal(parseEther("0.05"))
    })

    it("when 16 burned", async () => {
      expect(await token.burnPrice(16)).to.equal(parseEther("0.2"))
    })
    // total 5429.375
  })

  describe("Claimable balance", () => {
    beforeEach(async () => {
      token = await deployedToken()
    })

    it("should include fee from a minted token", async () => {
      await mint('f', [], eoa)

      const claimableBalance = formatEther(await token.getClaimableBalance(eoa.address))
      const allContributions = formatEther(await token.CONTRIBUTIONS())

      expect(claimableBalance).to.eq(allContributions)
    })

    it("should include burned tokens", async () => {
      const tokenId = await mint('f', [], eoa)
      await token.connect(eoa).burn(tokenId)

      const claimableBalance = formatEther(await token.getClaimableBalance(eoa.address))
      const allContributions = formatEther(await token.CONTRIBUTIONS())

      expect(claimableBalance).to.eq(allContributions)
    })

    it("should include all minted tokens", async () => {
      for (let i = 0; i < 20; i++) { await mint('f', [], eoa) }

      const claimableBalance = formatEther(await token.getClaimableBalance(eoa.address))
      const allContributions = formatEther(await token.CONTRIBUTIONS())

      expect(claimableBalance).to.eq(allContributions)
    })

    it("should include all burned tokens", async () => {
      let tokenIds: BigNumber[] = []
      for (let i = 0; i < 6; i++) { tokenIds.push(await mint('f', [], eoa)) }
      await token.connect(eoa).burn(tokenIds[0])
      for (let i = 0; i < 2; i++) { tokenIds.push(await mint('f', [])) }
      await token.connect(eoa).burn(tokenIds[2])
      for (let i = 0; i < 6; i++) { tokenIds.push(await mint('f', [], eoa)) }

      const ownerClaimableBalance = await token.getClaimableBalance(owner.address)
      const eoaClaimableBalance = await token.getClaimableBalance(eoa.address)
      const claimableBalance = parseFloat(formatEther(ownerClaimableBalance.add(eoaClaimableBalance)))
      const allContributions = parseFloat(formatEther(await token.CONTRIBUTIONS()))
      expect(claimableBalance).to.eq(allContributions)
    })

    it("should include just transfered tokens", async () => {
      let tokenIds: BigNumber[] = []
      for (let i = 0; i < 8; i++) { tokenIds.push(await mint('f', [], eoa)) }

      await token.connect(eoa)['safeTransferFrom(address,address,uint256)'](eoa.address, owner.address, tokenIds[0])
      await token.connect(eoa)['safeTransferFrom(address,address,uint256)'](eoa.address, owner.address, tokenIds[5])

      const claimableBalance = formatEther(await token.getClaimableBalance(eoa.address))
      const allContributions = formatEther(await token.CONTRIBUTIONS())

      expect(claimableBalance).to.eq(allContributions)
    })

    it("after transfer should be 0 for a new owner", async () => {
      let tokenIds: BigNumber[] = []
      for (let i = 0; i < 8; i++) { tokenIds.push(await mint('f', [], eoa)) }

      await token.connect(eoa)['safeTransferFrom(address,address,uint256)'](eoa.address, owner.address, tokenIds[0])
      await token.connect(eoa)['safeTransferFrom(address,address,uint256)'](eoa.address, owner.address, tokenIds[5])

      const claimableBalance = await token.getClaimableBalance(owner.address)

      expect(claimableBalance).to.eq(0)
    })

    it("should accrue for a new owner", async () => {
      let tokenIds: BigNumber[] = []
      for (let i = 0; i < 4; i++) { tokenIds.push(await mint('f', [], eoa)) }
      await token.connect(eoa)['safeTransferFrom(address,address,uint256)'](eoa.address, owner.address, tokenIds[0])
      await token.connect(eoa)['safeTransferFrom(address,address,uint256)'](eoa.address, owner.address, tokenIds[1])
      for (let i = 0; i < 4; i++) { tokenIds.push(await mint('f', [], eoa)) }

      const ownerClaimableBalance = parseFloat(formatEther(await token.getClaimableBalance(owner.address))).toFixed(12)
      const eoaClaimableBalance = await token.getClaimableBalance(eoa.address)
      const contributions = parseFloat(formatEther((await token.CONTRIBUTIONS()).sub(eoaClaimableBalance))).toFixed(12)

      expect(ownerClaimableBalance).to.eq(contributions)
    })
  })

  describe("Claiming", () => {
    beforeEach(async () => {
      token = await deployedToken()
    })

    it("is increasing eoa balance", async () => {
      await mint('f', [], eoa)
      const balanceBefore = await eoa.getBalance()
      const claimableBalance = await token.getClaimableBalance(eoa.address)
      const reciept = await (await token.connect(eoa).claim()).wait()
      const balanceAfter = formatEther(await eoa.getBalance())
      const after = formatEther(balanceBefore.add(claimableBalance).sub(reciept.effectiveGasPrice.mul(reciept.cumulativeGasUsed)))

      expect(balanceAfter).to.eq(after)
    })

    it("shouldn't be possible twice", async () => {
      await mint('f', [], eoa)
      await token.connect(eoa).claim()
      const claimableBalance = await token.getClaimableBalance(eoa.address)

      expect(claimableBalance).to.eq(0)
    })
  })

  describe("Token URI", () => {
    it("should have a base", async () => {
      const base = 'https://api.baseurl.com/'
      await token.setBaseURI(base)
      const tokenId = await mint('token')
      const url = await token.tokenURI(tokenId)
      expect(url).to.eq(base + tokenId)
    })
  })

  describe("Minting", () => {
    it("Should mint the formula", async () => {
      const tokenId = await mint('formula')

      expect(tokenId).to.not.be.empty
    })

    it("Should set formula owner", async () => {
      const tokenId = await mint('formula', [], eoa)

      expect(await token.ownerOf(tokenId)).to.equal(eoa.address)
    })

    it("Should reject params larger than uint8", async () => {
      await expect(mint('formula', [1024])).to.be.reverted
    })

    it("should be capped", async () => {
      const maxSupply = await token.MAX_SUPPLY()

      let i = parseInt(await token.totalSupply())
      do {
        await mint('formula is bit longer', [255])
        i += 1
      } while (i < maxSupply)

      await expect(mint('formula')).to.be.reverted
      expect(parseInt(await token.totalSupply())).to.eq(maxSupply)
      token = await deployedToken() // new token, because supply is maxed
    })
  })

  describe("Burning", () => {
    it("should be possible to burn a token", async () => {
      const tokenId = await mint('formula')
      await (await token.burn(tokenId)).wait()
      await expect(token.ownerOf(tokenId)).to.be.reverted
    })

    it("reverses totalSupply when burning tokens", async () => {
      const tokenId = await mint('formula')
      const before = await token.totalSupply()
      await token.burn(tokenId)
      const after = await token.totalSupply()
      expect(after).to.eq(before - 1)
    })

    it("allowed only to owner", async () => {
      const tokenId = await mint('formula')
      await expect(token.connect(eoa).burn(tokenId)).to.be.reverted
    })

    it("sends reserve balance to a token holder", async () => {
      const tokenId = await mint('formula')
      const metadata = await token.tokenMetadata(tokenId)
      const burnPrice: BigNumber = BigNumber.from(await token.burnPrice(metadata.sequence))
      const before = await owner.getBalance()
      const reciept = await (await token.burn(tokenId)).wait()
      const after = await owner.getBalance()
      expect(before).to.eq(after.sub(burnPrice).add(reciept.effectiveGasPrice.mul(reciept.cumulativeGasUsed)))
    })
  })

  describe("Metadata", () => {
    it("should be set with params", async () => {
      const formulaId = (await mint('test', [1, 2, 3, 4])).toNumber()
      const tokenMetadata = await token.tokenMetadata(formulaId)

      expect(tokenMetadata.formula).to.equal('test')
      expect(tokenMetadata.params.length).to.equal(4)
      expect(tokenMetadata.params[0]).to.equal(1)
      expect(tokenMetadata.params[3]).to.equal(4)
    })

    it("should return all tokens", async () => {
      await mint('test1')
      await mint('test2')
      const all = await token.allTokensMetadata()

      expect(all.length).to.be.gte(2)
    })
  })

  describe("Withdrawing", () => {
    it("should be able to withdraw", async () => {
      await mint('new formula')
      const contractBefore = await token.getBalance()
      const accountBefore = await owner.getBalance()
      const reciept = await (await token.withdraw()).wait()
      const contractAfter = await token.getBalance()
      const accountAfter = await owner.getBalance()
      expect(contractBefore).to.eq(contractAfter.add(accountAfter).sub(accountBefore).add(reciept.effectiveGasPrice.mul(reciept.cumulativeGasUsed)))
    })

    it("should include claimed contributions", async () => {
      await mint('owner formula')
      await mint('owner formula')
      await mint('new formula', [], eoa)
      await mint('new formula', [], eoa)

      await token.claim()
      await token.connect(eoa).claim()

      const contractBefore = await token.getBalance()
      const accountBefore = await owner.getBalance()
      const reciept = await (await token.withdraw()).wait()
      const contractAfter = await token.getBalance()
      const accountAfter = await owner.getBalance()
      expect(accountAfter).to.be.gt(accountBefore)
      expect(contractBefore).to.eq(contractAfter.add(accountAfter).sub(accountBefore).add(reciept.effectiveGasPrice.mul(reciept.cumulativeGasUsed)))
    })

    it("only by admin", async () => {
      await expect(token.connect(eoa).withdraw()).to.be.reverted
    })
  })
})
