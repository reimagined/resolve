import { ResourceAlreadyExistError as StorageResourceAlreadyExistError } from 'resolve-storage-base'
import { ResourceAlreadyExistError as SnapshotResourceAlreadyExistError } from 'resolve-snapshot-base'

import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')

  try {
    await resolve.storageAdapter.init()
  } catch (error) {
    if (!(error instanceof StorageResourceAlreadyExistError)) {
      throw error
    }
  }

  try {
    await resolve.snapshotAdapter.init()
  } catch (error) {
    if (!(error instanceof SnapshotResourceAlreadyExistError)) {
      throw error
    }
  }

  try {
    // TODO: invoke "init" only during first run
    await resolve.encryptionAdapter.init()
  } catch (e) {}

  const applicationPromises = []
  for (const listenerName of resolve.eventListeners.keys()) {
    applicationPromises.push(resolve.doUpdateRequest(listenerName))
  }

  await Promise.all(applicationPromises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
