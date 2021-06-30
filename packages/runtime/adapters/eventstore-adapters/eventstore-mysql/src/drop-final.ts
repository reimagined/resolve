import { getLog } from './get-log'
import { AdapterPool } from './types'

const dropFinal = async ({ database }: AdapterPool): Promise<any[]> => {
  const log = getLog('dropFinal')

  log.debug(`finished dropping event store in ${database}`)
  return []
}

export default dropFinal
