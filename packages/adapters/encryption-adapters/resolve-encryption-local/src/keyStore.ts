import { v4 } from 'uuid'
import { AggregateId, EncryptionKey } from 'resolve-encryption-base'

export type KeyStoreOptions = {
  /*
  INSERT SQLITE OPTIONS HERE
  user: string
  host: string
  database: string
  password: string
  port: 54320
  */
}

export type KeyStore = {
  create: (selector: AggregateId) => Promise<EncryptionKey>
  get: (selector: AggregateId) => Promise<EncryptionKey | null>
  set: (selector: AggregateId, key: EncryptionKey) => Promise<void>
  forget: (selector: AggregateId) => Promise<void>
}

export const createStore = (options: KeyStoreOptions): KeyStore => ({
  create: (): Promise<EncryptionKey> => Promise.resolve(v4()),
  get: (selector: AggregateId): Promise<EncryptionKey | null> =>
    Promise.resolve(`the-key-to-${selector}`),
  set: (): Promise<void> => Promise.resolve(),
  forget: (): Promise<void> => Promise.resolve()
})
