import type { AdapterPoolPrimal } from './types'
import { RequestTimeoutError } from '@resolve-js/eventstore-base'

const checkRequestTimeout = (pool: AdapterPoolPrimal): number | undefined => {
  if (typeof pool.getVacantTimeInMillis === 'function') {
    const vacantTimeInMillis = pool.getVacantTimeInMillis()
    if (Number.isNaN(vacantTimeInMillis)) {
      throw new RequestTimeoutError('Got NaN as vacant time')
    }
    if (vacantTimeInMillis < 0) {
      throw new RequestTimeoutError(
        `No vacant time to process the query ${vacantTimeInMillis}`
      )
    }
    return vacantTimeInMillis
  }
  return undefined
}

export default checkRequestTimeout
