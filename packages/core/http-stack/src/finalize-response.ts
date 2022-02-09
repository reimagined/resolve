import type { HttpResponse, InternalResponse } from './types'
import { INTERNAL, SET_COOKIE, VARY } from './constants'
import normalizeKey from './normalize-key'

const finalizeResponse = (res: HttpResponse): InternalResponse => {
  const { headers, cookies, varyHeaderKeys } = res[INTERNAL]
  for (const cookieHeader of cookies) {
    headers.push([normalizeKey(SET_COOKIE, 'upper-dash-case'), cookieHeader])
  }
  if (varyHeaderKeys.size > 0) {
    headers.push([
      normalizeKey(VARY, 'upper-dash-case'),
      Array.from(varyHeaderKeys).join(','),
    ])
  }

  return res[INTERNAL]
}

export default finalizeResponse
