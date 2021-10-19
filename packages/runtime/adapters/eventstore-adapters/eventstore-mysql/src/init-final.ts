import { getLog } from './get-log'
import { AdapterPool } from './types'

const initFinal = async ({ database }: AdapterPool): Promise<any[]> => {
  const log = getLog('initFinal')

  log.debug(`finished initializing event store in ${database}`)
  return []
}

export default initFinal
