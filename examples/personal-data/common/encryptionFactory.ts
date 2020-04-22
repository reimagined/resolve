import Cryptr from 'cryptr'
import { generate } from 'generate-password'
import {
  EncryptedBlob,
  Encryption,
  PlainData,
  SecretsManager
} from 'resolve-core'

const encrypt = (key: string, data: PlainData): EncryptedBlob => {
  const { encrypt } = new Cryptr(key)
  return encrypt(JSON.stringify(data))
}

const decrypt = (key: string, blob: EncryptedBlob): PlainData => {
  const { decrypt } = new Cryptr(key)
  return JSON.parse(decrypt(blob))
}

export default async (
  aggregateId: string,
  secretsManager: SecretsManager
): Promise<Encryption> => {
  let aggregateKey = await secretsManager.getSecret(aggregateId)
  if (!aggregateKey) {
    aggregateKey = generate({
      length: 20,
      numbers: true
    })
    await secretsManager.setSecret(aggregateId, aggregateKey)
  }
  return {
    encrypt: (data): EncryptedBlob => encrypt(aggregateKey, data),
    decrypt: (blob): PlainData => decrypt(aggregateKey, blob)
  }
}
