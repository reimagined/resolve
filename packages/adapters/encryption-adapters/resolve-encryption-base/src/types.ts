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
  init: () => Promise<void>
  getEncrypter: (selector: AggregateId) => Promise<Encrypter>
  getDecrypter: (selector: AggregateId) => Promise<Decrypter | null>
  forget: (selector: AggregateId) => Promise<void>
}

export type KeyStore = {
  create: (selector: AggregateId) => Promise<EncryptionKey>
  get: (selector: AggregateId) => Promise<EncryptionKey | null>
  set: (selector: AggregateId, key: EncryptionKey) => Promise<void>
  forget: (selector: AggregateId) => Promise<void>
  init: () => Promise<void>
  drop: () => Promise<void>
  dispose: () => Promise<void>
}

export type Pool<Database> = {
  connectPromiseResolve: Function
  connectPromise: Promise<any>
  disposed: boolean
  isInitialized: boolean
  store: KeyStore
  database: Database
  algorithm: EncryptionAlgorithm
}

export type CreateAdapterOptions<Database, KeyStoreOptions> = {
  connect: (pool: Pool<Database>, options: KeyStoreOptions) => Promise<Database>
  init: (pool: Pool<Database>) => Promise<void>
  getEncrypter: (
    pool: Pool<Database>,
    selector: AggregateId
  ) => Promise<Encrypter>
  getDecrypter: (
    pool: Pool<Database>,
    selector: AggregateId
  ) => Promise<Decrypter | null>
  forget: (pool: Pool<Database>, selector: AggregateId) => Promise<void>
  createStore: (pool: Pool<Database>, options: KeyStoreOptions) => KeyStore
}

export type AES256EncryptionOptions = {
  type: 'AES256'
}

export type AlgorithmOptions = AES256EncryptionOptions

export type Options<KeyStoreOptions> = {
  algorithm: AlgorithmOptions
  keyStore: KeyStoreOptions
}
