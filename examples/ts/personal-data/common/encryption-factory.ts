import { AES, enc } from 'crypto-js'
import { generate } from 'generate-password'
import {
  Decrypter,
  Encrypter,
  Encryption,
  SecretsManager,
} from '@resolve-js/core'

export const getEncrypter = (key: string): Encrypter => (data) =>
  AES.encrypt(JSON.stringify(data), key).toString()

export const getDecrypter = (key: string): Decrypter => (blob) => {
  try {
    return JSON.parse(AES.decrypt(blob, key).toString(enc.Utf8))
  } catch {
    return null
  }
}

const encryptionFactory = async (
  aggregateId: string,
  secretsManager: SecretsManager,
  generateKey = true
): Promise<Encryption> => {
  let aggregateKey = await secretsManager.getSecret(aggregateId)
  if (!aggregateKey && generateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true,
    })
    await secretsManager.setSecret(aggregateId, aggregateKey)
  }
  if (!aggregateKey) {
    return null
  }
  return {
    encrypt: getEncrypter(aggregateKey),
    decrypt: getDecrypter(aggregateKey),
  }
}

export default encryptionFactory
