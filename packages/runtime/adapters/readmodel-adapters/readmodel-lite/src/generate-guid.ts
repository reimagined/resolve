import { GenerateGuidMethod } from './types'

const generateGuid: GenerateGuidMethod = (...args) => {
  const baseBuffer = Buffer.from(`${args.map(String).join('')}`)
  const resultBuffer = Buffer.alloc(8)

  for (let index = 0; index < baseBuffer.length; index++) {
    resultBuffer[index % 8] = resultBuffer[index % 8] ^ baseBuffer[index]
  }

  const result = `e${resultBuffer.toString('hex').toLowerCase()}`

  return result
}

export default generateGuid
