import RDSDataService from 'aws-sdk/clients/rdsdataservice'
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
import { createStore } from './keyStore'
import { KeyStoreOptions } from './types'

import _createResource from './resource/create'
import _disposeResource from './resource/dispose'
import _destroyResource from './resource/destroy'
import _executeStatement from './resource/executeStatement'

const init = async (pool: Pool<RDSDataService>): Promise<void> => {
  const { store } = pool
  await store.init()
}
const dispose = async (pool: Pool<RDSDataService>): Promise<void> => {
  const { store } = pool
  await store.dispose()
}
const getEncrypter = async (
  pool: Pool<RDSDataService>,
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
  pool: Pool<RDSDataService>,
  selector: AggregateId
): Promise<Decrypter | null> => {
  const { store, algorithm } = pool

  const key = await store.get(selector)
  if (!key) {
    return null
  }
  return (blob: EncryptedBlob): PlainData => algorithm.decrypt(key, blob)
}
const forget = (
  pool: Pool<RDSDataService>,
  selector: AggregateId
): Promise<void> => {
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

const pool = {
  RDSDataService,
  executeStatement: _executeStatement
}

const createResource = _createResource.bind(null, pool)
const disposeResource = _disposeResource.bind(null, pool)
const destroyResource = _destroyResource.bind(null, pool)

Object.assign(pool, {
  createResource,
  disposeResource,
  destroyResource
})

export {
  createResource as create,
  disposeResource as dispose,
  destroyResource as destroy
}
