import { getLog } from './get-log'
import { AdapterPool } from './types'

const dropFinal = async ({
  memoryStore,
  databaseFile,
}: AdapterPool): Promise<any[]> => {
  const log = getLog('dropFinal')

  const errors: any[] = []

  if (memoryStore != null) {
    try {
      memoryStore.drop()
    } catch (e) {
      log.error(e.message)
      log.verbose(e.stack)
      errors.push(e)
    }
  }

  log.debug(`finished dropping event store in ${databaseFile}`)
  return errors
}

export default dropFinal
