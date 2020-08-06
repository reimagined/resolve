import { AES, enc } from 'crypto-js'
import { generate } from 'generate-password'

export const getEncrypter = key => data =>
  AES.encrypt(JSON.stringify(data), key).toString()

export const getDecrypter = key => blob => {
  try {
    return JSON.parse(AES.decrypt(blob, key).toString(enc.Utf8))
  } catch {
    return null
  }
}

export default async (aggregateId, secretsManager, generateKey = true) => {
  const brokenSelector = aggregateId.substring(8)

  let aggregateKey = await secretsManager.getSecret(brokenSelector)
  if (!aggregateKey && generateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true
    })
    await secretsManager.setSecret(brokenSelector, aggregateKey)
  }
  if (!aggregateKey) {
    return null
  }
  return {
    encrypt: getEncrypter(aggregateKey),
    decrypt: getDecrypter(aggregateKey)
  }
}
