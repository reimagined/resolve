import type { IncomingMessage, ServerResponse } from 'http'

import type { HttpRequest, HttpResponse } from '../types'
import getSafeErrorMessage from '../get-safe-error-message'
import getDebugErrorMessage from '../get-debug-error-message'
import { INTERNAL } from '../constants'
import createResponse from '../create-response'
import createRequest from './create-request'

const wrapApiHandler = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  handler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void>,
  getCustomParameters: (
    req: IncomingMessage,
    res: ServerResponse
  ) => CustomParameters | Promise<CustomParameters> = () => ({} as any),
  onStart: (timestamp: number) => void = Function() as any,
  onFinish: (timestamp: number, error?: any) => void = Function() as any
) => async (req: IncomingMessage, res: ServerResponse) => {
  if (onStart != null) {
    onStart(Date.now())
  }

  try {
    const customParameters = await getCustomParameters(req, res)

    const httpReq = await createRequest<CustomParameters>(req, customParameters)
    const httpRes = createResponse()

    await handler(httpReq, httpRes)

    const { status, headers, cookies, body } = httpRes[INTERNAL]
    for (const cookieHeader of cookies) {
      headers.push(['Set-Cookie', cookieHeader])
    }

    res.writeHead(status, headers)
    res.end(body)

    onFinish(Date.now())
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(getDebugErrorMessage(error))

    res.statusCode = 500
    res.end(getSafeErrorMessage(error))

    onFinish(Date.now(), error)
  }
}

export default wrapApiHandler
