import type { InternalResponse } from './types'

const validateResponseOpened = (internalRes: InternalResponse) => {
  if (internalRes.closed) {
    throw new Error('Response already sent')
  }
}

export default validateResponseOpened
