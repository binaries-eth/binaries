import { UPNG } from '../utils/upng.js'
import { Interface } from '@ethersproject/abi'
import fetch from 'node-fetch'

const contractAddress = "0xaBd3606A72469e4Dbda2E0c6a3c0Dff7473aa5c3"
const contractAbi = [
  "function tokenMetadata(uint tokenId) view returns (tuple(address owner,address minter,string formula,uint8[] params,uint tokenId,uint sequence,uint burnPrice) metadata)",
]
const contractInterface = new Interface(contractAbi)

const metadata = async (id) => {
  let calldata = contractInterface.encodeFunctionData('tokenMetadata', [id])
  let response = await fetch("https://cloudflare-eth.com", {
    method: "POST",
    body: `{ "id": 1, "jsonrpc": "2.0", "method": "eth_call", "params": [{"to":"${contractAddress}", "data":"${calldata}"}, "latest"] }`
  })
  let rawMetadata = (await response.json())['result']

  return contractInterface.decodeFunctionResult('tokenMetadata', rawMetadata)
}

const uniqueOnly = (value, index, self) => self.indexOf(value) === index

const mathMethods = Object.getOwnPropertyNames(Math)

const extendWithMath = (func) => {
  const mathMatches = func.match(/p[0-9]{1}|[a-zA-Z]+/g).filter((string) => mathMethods.indexOf(string) > -1).filter(uniqueOnly)
  mathMatches.forEach((string) => {
    func = func.replaceAll(string, `Math.${string}`)
  })

  return func
}
const evaled = (f) => {
  return eval(`({x,y,p1,p2,p3,p4,p5,p6,p7,p8,p9}) => ${extendWithMath(f)}`)
}

const parseParams = (p) => Object.fromEntries(p.map((v, i) => [`p${i+1}`, v]))

const size = 512

const imageData = ({ formula, params }) => {
  if (!formula) { throw 'Missing formula' }
  if (!params) { throw 'Missing params' }

  let f = evaled(formula)
  let p = parseParams(params)

  let a = {...p}
  let buffer = new Uint8ClampedArray(4*size*size)
  let pixel, pos
  for (a.x = -size/2; a.x < size/2; a.x++) {
    for (a.y = -size/2; a.y < size/2; a.y++) {
      pixel = f(a)
      pos = ((a.y + size/2) * size + a.x + size/2) * 4
      buffer[pos] = pixel ? '0xef' : '0x11'
      buffer[pos + 1] = pixel ? '0xef' : '0x11'
      buffer[pos + 2] = pixel ? '0xef' : '0x11'
      buffer[pos + 3] = pixel ? '0xFF' : '0xFF'
    }
  }

  let rawPng = UPNG.encode([buffer.buffer], size, size, 0)
  let png = Buffer.from(rawPng)

  return png
}

const handleImage = async (id) => {
  let mdata = await metadata(id)
  let idata = imageData(mdata.metadata)

  return idata
}

export { handleImage }