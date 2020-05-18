import { ResourceAlreadyExistError as EventstoreResourceAlreadyExistError } from 'resolve-eventstore-base'
import { ResourceAlreadyExistError as SnapshotResourceAlreadyExistError } from 'resolve-snapshot-base'

import debugLevels from 'resolve-debug-levels'

const log = debugLevels('resolve:resolve-runtime:bootstrap')

const bootstrap = async resolve => {
  log.debug('bootstrap started')

  try {
    await resolve.eventstoreAdapter.init()
  } catch (error) {
    if (!(error instanceof EventstoreResourceAlreadyExistError)) {
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

  const applicationPromises = []
  for (const listenerName of resolve.eventListeners.keys()) {
    applicationPromises.push(resolve.doUpdateRequest(listenerName))
  }

  await Promise.all(applicationPromises)

  log.debug('bootstrap successful')

  return 'ok'
}

export default bootstrap
