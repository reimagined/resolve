import {
  Decrypter,
  EncryptedBlob,
  Encrypter,
  PlainData,
  SecretStore
} from 'resolve-core'

type Encryption = {
  encrypt: Encrypter
  decrypt: Decrypter
}

export const getEncryption = async (
  secretStore: SecretStore,
  secretId: string
): Promise<Encryption> => {
  let key = await secretStore.getSecret(secretId)
  if (!key) {
    key = 'new-key'
  }

  // when to store the key?

  const encrypt = (data: PlainData): EncryptedBlob => {
    return `${key}-${data}`
  }
  const decrypt = (blob: EncryptedBlob): PlainData => {
    if (blob.startsWith(key)) {
      return blob.slice(key.length)
    }
    throw Error('invalid encryption key')
  }

  return {
    encrypt,
    decrypt
  }
}
