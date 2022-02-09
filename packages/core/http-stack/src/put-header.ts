import type { InternalResponse } from './types'
import normalizeKey from './normalize-key'

const putHeader = (
  headers: InternalResponse['headers'],
  key: string,
  value: string
) => {
  const normalizedKey = normalizeKey(key, 'upper-dash-case')

  const header = headers.find(([key]) => key === normalizedKey)
  if (header == null) {
    headers.push([normalizedKey, value])
  } else {
    header[1] = value
  }
}

export default putHeader
