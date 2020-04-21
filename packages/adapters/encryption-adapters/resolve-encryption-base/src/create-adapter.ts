import {
  Pool,
  EncryptionAdapter,
  CreateAdapterOptions,
  KeyStore,
  Options,
  ExportStreamOptions,
  ImportStreamOptions
} from './types'
import wrapMethod from './wrap-method'
import { createAlgorithm } from './algorithms/factory'
import createExportStream from './export-stream'
import createImportStream from './import-stream'
import { ExportStream } from './export-stream'
import { ImportStream } from './import-stream'

function createAdapter<KeyStoreOptions, Database>(
  params: CreateAdapterOptions<Database, KeyStoreOptions>,
  options: Options<KeyStoreOptions>
): EncryptionAdapter<Database> {
  const {
    connect,
    forget,
    getDecrypter,
    getEncrypter,
    init,
    dispose,
    createStore
  } = params

  let pool: Pool<Database>

  let connectPromiseResolve: Function
  const connectPromise = new Promise(resolve => {
    connectPromiseResolve = resolve.bind(null, null)
  }).then(async () => {
    pool.database = await connect(pool, options.keyStore)
  })

  let store: KeyStore | null = null
  let database: Database | null = null
  pool = {
    get connectPromiseResolve(): Function {
      return connectPromiseResolve
    },
    get store(): KeyStore {
      if (store == null) {
        throw new TypeError()
      }
      return store
    },
    set store(value: KeyStore) {
      store = value
    },
    get database(): Database {
      if (database == null) {
        throw new TypeError()
      }
      return database
    },
    set database(value: Database) {
      database = value
    },
    connectPromise,
    disposed: false,
    isInitialized: false,
    algorithm: createAlgorithm(options.algorithm)
  }
  pool.store = createStore(pool, options.keyStore)

  const createExportStreamWithPool = (
    streamOptions: ExportStreamOptions
  ): ExportStream<Database> => {
    return createExportStream(pool, streamOptions)
  }

  const createImportStreamWithPool = (
    streamOptions: ImportStreamOptions
  ): ImportStream<Database> => {
    return createImportStream(pool, streamOptions)
  }
  const adapter = {
    init: wrapMethod(pool, init),
    getEncrypter: wrapMethod(pool, getEncrypter),
    getDecrypter: wrapMethod(pool, getDecrypter),
    forget: wrapMethod(pool, forget),
    dispose: wrapMethod(pool, dispose),
    createExportStream: createExportStreamWithPool,
    createImportStream: createImportStreamWithPool
  }

  return Object.freeze(adapter)
}

export default createAdapter
