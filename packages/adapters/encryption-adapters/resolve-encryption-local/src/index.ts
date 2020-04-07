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
import { createStore, KeyStoreOptions } from './keyStore'

type Options = {
  algorithm: AlgorithmOptions
  keyStore: KeyStoreOptions
}

export default (options: Options): EncryptionAdapter => {
  const algorithm = createAlgorithm(options.algorithm)
  const store = createStore(options.keyStore)

  const getEncrypter = async (selector: AggregateId): Promise<Encrypter> => {
    const key = (await store.get(selector)) || (await store.create(selector))
    return (data: PlainData): EncryptedBlob => algorithm.encrypt(key, data)
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
  const forget = (selector: AggregateId): Promise<void> => store.forget(selector)

  return Object.freeze({
    getEncrypter,
    getDecrypter,
    forget
  })
}
