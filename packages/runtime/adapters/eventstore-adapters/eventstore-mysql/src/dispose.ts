import { getLog } from './get-log'
import { AdapterPool } from './types'

const dispose = async (pool: AdapterPool): Promise<any> => {
  const log = getLog('dispose')

  log.debug(`disposing the event store`)

  await pool.connection.end()

  log.debug(`the event store disposed`)
}

export default dispose
