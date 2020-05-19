import Cryptr from 'cryptr'
import { generate } from 'generate-password'

const encrypt = (key, data) => {
  const { encrypt } = new Cryptr(key)
  return encrypt(JSON.stringify(data))
}

const decrypt = (key, blob) => {
  const { decrypt } = new Cryptr(key)
  try {
    return JSON.parse(decrypt(blob))
  } catch {
    return null
  }
}

export default async (aggregateId, secretsManager, generateKey = true) => {
  let aggregateKey = await secretsManager.getSecret(aggregateId)
  if (!aggregateKey && generateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true
    })
    await secretsManager.setSecret(aggregateId, aggregateKey)
  }
  if (!aggregateKey) {
    return null
  }
  return {
    encrypt: data => encrypt(aggregateKey, data),
    decrypt: blob => decrypt(aggregateKey, blob)
  }
}
