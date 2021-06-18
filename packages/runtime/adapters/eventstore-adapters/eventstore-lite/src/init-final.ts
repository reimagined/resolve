import { getLog } from './get-log'
import { AdapterPool } from './types'

const initFinal = async ({ databaseFile }: AdapterPool): Promise<any[]> => {
  const log = getLog('initFinal')

  log.debug(
    `finished initializing event store in ${databaseFile ?? ':memory:'}`
  )
  return []
}

export default initFinal
