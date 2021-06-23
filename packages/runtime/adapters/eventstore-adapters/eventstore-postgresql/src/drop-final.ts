import { getLog } from './get-log'
import { AdapterPool } from './types'

const dropFinal = async ({ databaseName }: AdapterPool): Promise<any[]> => {
  const log = getLog('dropFinal')

  log.debug(`finished dropping event store in ${databaseName}`)
  return []
}

export default dropFinal
