import type { IncomingMessage, ServerResponse } from 'http'

import type {
  HttpRequest,
  HttpResponse,
  OnStartCallback,
  OnFinishCallback,
} from '../types'
import createResponse from '../create-response'
import createRequest from './create-request'
import finalizeResponse from '../finalize-response'
import getSafeErrorMessage from '../get-safe-error-message'
import getDebugErrorMessage from '../get-debug-error-message'

export type GetCustomParameters<
  CustomParameters extends Record<string | symbol, any> = {}
> = (
  externalReq: IncomingMessage,
  externalRes: ServerResponse
) => CustomParameters | Promise<CustomParameters>

const wrapApiHandler = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  handler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void>,
  getCustomParameters: GetCustomParameters<CustomParameters> = () =>
    ({} as any),
  // eslint-disable-next-line no-new-func
  onStart: OnStartCallback<CustomParameters> = Function() as any,
  // eslint-disable-next-line no-new-func
  onFinish: OnFinishCallback<CustomParameters> = Function() as any
) => async (externalReq: IncomingMessage, externalRes: ServerResponse) => {
  const startTime = Date.now()

  try {
    const customParameters = await getCustomParameters(externalReq, externalRes)

    const req = await createRequest<CustomParameters>(
      externalReq,
      customParameters
    )
    const res = createResponse()

    onStart(startTime, req, res)

    try {
      await handler(req, res)

      const { status, headers, body } = await finalizeResponse(res)

      externalRes.writeHead(status, headers)
      externalRes.end(body)

      onFinish(Date.now(), req, res)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(getDebugErrorMessage(error))

      externalRes.statusCode = 500
      externalRes.end(getSafeErrorMessage(error))

      onFinish(Date.now(), req, res, error)
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(getDebugErrorMessage(error))

    externalRes.statusCode = 500
    externalRes.end(getSafeErrorMessage(error))
  }
}

export default wrapApiHandler
