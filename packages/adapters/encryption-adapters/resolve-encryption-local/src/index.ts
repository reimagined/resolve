import { Database } from 'sqlite'
import {
  AggregateId,
  Decrypter,
  EncryptedBlob,
  Encrypter,
  PlainData,
  createAdapter,
  Pool,
  Options
} from 'resolve-encryption-base'
import connect from './connect'

import { createStore } from './key-store'
import { KeyStoreOptions } from './types'

const init = async (pool: Pool<Database>): Promise<void> => {
  const { store } = pool
  await store.init()
}

const dispose = async (pool: Pool<Database>): Promise<void> => {
  const { store } = pool
  await store.dispose()
}

const getEncrypter = async (
  pool: Pool<Database>,
  selector: AggregateId
): Promise<Encrypter> => {
  const { store, algorithm } = pool

  let key = await store.get(selector)
  if (!key) {
    key = await store.create(selector)
    await store.set(selector, key)
  }
  return (data: PlainData): EncryptedBlob =>
    algorithm.encrypt(key as string, data)
}
const getDecrypter = async (
  pool: Pool<Database>,
  selector: AggregateId
): Promise<Decrypter | null> => {
  const { store, algorithm } = pool

  const key = await store.get(selector)
  if (!key) {
    return null
  }
  return (blob: EncryptedBlob): PlainData => algorithm.decrypt(key, blob)
}
const forget = (pool: Pool<Database>, selector: AggregateId): Promise<void> => {
  const { store } = pool
  return store.forget(selector)
}

export default (options: Options<KeyStoreOptions>) =>
  createAdapter(
    {
      init,
      getEncrypter,
      getDecrypter,
      forget,
      connect,
      createStore,
      dispose
    },
    options
  )
