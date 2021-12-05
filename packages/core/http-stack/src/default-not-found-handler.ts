import type { HttpRequest, HttpResponse } from './types'

const defaultNotFoundHandler = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  req: HttpRequest<CustomParameters>,
  res: HttpResponse
): void => {
  res.status(404)
  res.end()
}

export default defaultNotFoundHandler
