import type { HttpResponse, InternalResponse } from './types'
import { INTERNAL, SET_COOKIE, VARY } from './constants'

const finalizeResponse = (res: HttpResponse): InternalResponse => {
  const { headers, cookies, varyHeaderKeys } = res[INTERNAL]
  for (const cookieHeader of cookies) {
    headers.push([SET_COOKIE, cookieHeader])
  }
  if (varyHeaderKeys.size > 0) {
    headers.push([VARY, Array.from(varyHeaderKeys).join(',')])
  }

  return res[INTERNAL]
}

export default finalizeResponse
