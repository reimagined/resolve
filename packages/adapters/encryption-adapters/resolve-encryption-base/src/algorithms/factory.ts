import { createAES256Algorithm } from './aes256'
import { EncryptionAlgorithm, AlgorithmOptions } from '../types'

export const createAlgorithm = (
  options: AlgorithmOptions
): EncryptionAlgorithm => {
  switch (options.type) {
    case 'AES256':
      return createAES256Algorithm()
    default:
      throw Error(`unknown encryption algorithm: ${options.type}`)
  }
}
