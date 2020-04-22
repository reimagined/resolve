import { ExportStream } from './export-stream'
import { ImportStream } from './import-stream'

export type AggregateId = string
export type PlainData = string | object
export type EncryptionKey = string
export type EncryptedBlob = string
export type Encrypter = (data: PlainData) => EncryptedBlob
export type Decrypter = (blob: EncryptedBlob) => PlainData

export type ExportStreamOptions = {
  cursor?: number
  bufferSize?: number
}

export type ImportStreamOptions = {
  byteOffset?: number
  sequenceIndex?: number
}

export type Secret = {
  id: AggregateId
  key: EncryptionKey
}

export type EncryptionAlgorithm = {
  encrypt: (key: EncryptionKey, data: PlainData) => EncryptedBlob
  decrypt: (key: EncryptionKey, blob: EncryptedBlob) => PlainData
}

export type EncryptionAdapter<Database> = {
  init: () => Promise<void>
  dispose: () => Promise<void>
  getEncrypter: (selector: AggregateId) => Promise<Encrypter>
  getDecrypter: (selector: AggregateId) => Promise<Decrypter | null>
  forget: (selector: AggregateId) => Promise<void>
  createExportStream: (
    streamOptions: ExportStreamOptions
  ) => ExportStream<Database>
  createImportStream: (
    streamOptions: ImportStreamOptions
  ) => ImportStream<Database>
}

export type KeyStore = {
  create: (selector: AggregateId) => Promise<EncryptionKey>
  get: (selector: AggregateId) => Promise<EncryptionKey | null>
  set: (selector: AggregateId, key: EncryptionKey) => Promise<void>
  paginateSecrets: (offset: number, batchSize: number) => Promise<object[]>
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
  dispose: (pool: Pool<Database>) => Promise<void>
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
