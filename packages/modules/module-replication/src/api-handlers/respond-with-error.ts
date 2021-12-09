import type { ResolveResponse } from '@resolve-js/core'
import { getLog } from './get-log'

function respondWithError(context: string, res: ResolveResponse, error: any) {
  const log = getLog(context)

  if (
    error.name === 'AlreadyDisposedError' ||
    error.name === 'ServiceBusyError' ||
    error.name === 'RequestTimeoutError'
  ) {
    log.debug(error)
    res.status(503)
    res.end(`${error.name}: ${error.message}`)
  } else {
    log.error(error)
    res.status(500)
    res.end(`${error.name}: ${error.message}`)
  }
}

export default respondWithError
