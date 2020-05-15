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

export default async (aggregateId, secretsManager) => {
  let aggregateKey = await secretsManager.getSecret(aggregateId)
  if (!aggregateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true
    })
    await secretsManager.setSecret(aggregateId, aggregateKey)
  }
  return {
    encrypt: data => encrypt(aggregateKey, data),
    decrypt: blob => decrypt(aggregateKey, blob)
  }
}
