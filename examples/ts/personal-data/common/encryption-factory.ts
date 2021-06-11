import { AES, enc } from 'crypto-js'
import { generate } from 'generate-password'

export const getEncrypter = (key) => (data) =>
  AES.encrypt(JSON.stringify(data), key).toString()

export const getDecrypter = (key) => (blob) => {
  try {
    return JSON.parse(AES.decrypt(blob, key).toString(enc.Utf8))
  } catch {
    return null
  }
}

const encryptionFactory = async (
  aggregateId,
  secretsManager,
  generateKey = true
) => {
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
