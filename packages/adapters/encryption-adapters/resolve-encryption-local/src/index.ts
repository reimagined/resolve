import {
  AggregateId,
  AlgorithmOptions,
  createAlgorithm,
  Decrypter,
  EncryptedBlob,
  Encrypter,
  EncryptionAdapter,
  PlainData
} from 'resolve-encryption-base'
import { createStore } from './keyStore'
import { KeyStoreOptions } from './types'

type Options = {
  algorithm: AlgorithmOptions
  keyStore: KeyStoreOptions
}

export default (options: Options): EncryptionAdapter => {
  // eslint-disable-next-line no-console
  console.log(`building local encryption adapter`)
  // eslint-disable-next-line no-console
  console.log(`options: ${JSON.stringify(options)}`)

  const algorithm = createAlgorithm(options.algorithm)
  const store = createStore(options.keyStore)

  const init = async (): Promise<void> => await store.init()

  const getEncrypter = async (selector: AggregateId): Promise<Encrypter> => {
    let key = await store.get(selector)
    if (!key) {
      key = await store.create(selector)
      await store.set(selector, key)
    }
    return (data: PlainData): EncryptedBlob =>
      algorithm.encrypt(key as string, data)
  }
  const getDecrypter = async (
    selector: AggregateId
  ): Promise<Decrypter | null> => {
    const key = await store.get(selector)
    if (!key) {
      return null
    }
    return (blob: EncryptedBlob): PlainData => algorithm.decrypt(key, blob)
  }
  const forget = (selector: AggregateId): Promise<void> =>
    store.forget(selector)

  return Object.freeze({
    init,
    getEncrypter,
    getDecrypter,
    forget
  })
}
