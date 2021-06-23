import { getLog } from './get-log'
import { AdapterPool } from './types'

const dispose = async ({ connection }: AdapterPool): Promise<any> => {
  const log = getLog(`dispose`)
  log.debug(`disconnecting the event store adapter`)
  await connection.end()
  log.debug(`event store adapter disconnected`)
}

export default dispose
