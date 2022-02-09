import type { HttpRequest, HttpResponse } from './types'

const corsHandler = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  req: HttpRequest<CustomParameters>,
  res: HttpResponse
): void => {
  res.end()
}

export default corsHandler
