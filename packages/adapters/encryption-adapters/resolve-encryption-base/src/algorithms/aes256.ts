import Cryptr from 'cryptr'
import {
  EncryptedBlob,
  EncryptionAlgorithm,
  EncryptionKey,
  PlainData
} from '../types'

export type AES256EncryptionOptions = {
  type: 'AES256'
}

const objectBlobPrefix = '*object*'

const encrypt = (key: EncryptionKey, data: PlainData): EncryptedBlob => {
  const { encrypt } = new Cryptr(key)

  if (typeof data === 'string') {
    return encrypt(data)
  }
  return `${objectBlobPrefix}${encrypt(JSON.stringify(data))}`
}

const decrypt = (key: EncryptionKey, blob: EncryptedBlob): PlainData => {
  const { decrypt } = new Cryptr(key)
  if (blob.startsWith(objectBlobPrefix)) {
    return decrypt(blob.slice(objectBlobPrefix.length))
  }
  return decrypt(blob)
}

export const createAES256Algorithm = (): EncryptionAlgorithm => ({
  encrypt,
  decrypt
})
