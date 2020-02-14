import { declareRuntimeEnv } from 'resolve-scripts'

export default {
  target: 'cloud',
  mode: 'production',
  staticPath: declareRuntimeEnv('RESOLVE_CLOUD_STATIC_URL'),
  storageAdapter: {
    module: 'resolve-storage-lite',
    options: {
      databaseFile: 'data/event-store.db'
    }
  }
}
