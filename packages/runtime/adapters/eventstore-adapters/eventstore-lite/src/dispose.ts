import getLog from './get-log'
import { AdapterPool } from './types'

const dispose = async ({ database }: AdapterPool): Promise<any> => {
  const log = getLog('dispose')

  log.debug(`disposing the event store`)

  await database.close()

  log.debug(`the event store disposed`)
}

export default dispose
