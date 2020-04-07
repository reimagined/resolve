export type AggregateId = string
export type PlainData = string | object
export type EncryptionKey = string
export type EncryptedBlob = string
export type Encrypter = (data: PlainData) => EncryptedBlob
export type Decrypter = (blob: EncryptedBlob) => PlainData

export type EncryptionAlgorithm = {
  encrypt: (key: EncryptionKey, data: PlainData) => EncryptedBlob
  decrypt: (key: EncryptionKey, blob: EncryptedBlob) => PlainData
}

export type EncryptionAdapter = {
  getEncrypter: (selector: AggregateId) => Encrypter
  getDecrypter: (selector: AggregateId) => Decrypter | null
  forget: (selector: AggregateId) => Promise<void>
}
