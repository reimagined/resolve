import { getLog } from './get-log'
import { AdapterPool } from './types'

const initFinal = async ({ databaseName }: AdapterPool): Promise<any[]> => {
  const log = getLog('initFinal')

  log.debug(`finished initializing event store in ${databaseName}`)
  return []
}

export default initFinal
