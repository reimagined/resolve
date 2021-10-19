import type { GenerateGuidMethod } from './types'

const GUID_BYTES = 32

const generateGuid: GenerateGuidMethod = (...args) => {
  const baseBuffer = Buffer.from(`${args.map(String).join('')}`)
  const resultBuffer = Buffer.alloc(GUID_BYTES)

  for (let index = 0; index < baseBuffer.length; index++) {
    resultBuffer[index % GUID_BYTES] =
      resultBuffer[index % GUID_BYTES] ^ baseBuffer[index]
  }

  const result = `e${resultBuffer.toString('hex').toLowerCase()}`

  return result
}

export default generateGuid
