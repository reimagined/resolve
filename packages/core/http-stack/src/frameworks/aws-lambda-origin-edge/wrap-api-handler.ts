import type {
  LambdaOriginEdgeRequest,
  HttpRequest,
  HttpResponse,
  LambdaOriginEdgeResponse,
  OnStartCallback,
  OnFinishCallback,
} from '../../types'
import createRequest from './create-request'
import createResponse from '../../create-response'
import finalizeResponse from '../../finalize-response'
import getHttpStatusText from '../../get-http-status-text'
import getSafeErrorMessage from '../../get-safe-error-message'
import getDebugErrorMessage from '../../get-debug-error-message'

export type GetCustomParameters<
  CustomParameters extends Record<string | symbol, any> = {}
> = (
  lambdaEvent: LambdaOriginEdgeRequest,
  lambdaContext: any
) => CustomParameters | Promise<CustomParameters>

const wrapApiHandler = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  handler: (
    req: HttpRequest<CustomParameters & { requestStartTime: number }>,
    res: HttpResponse
  ) => Promise<void>,
  getCustomParameters: GetCustomParameters<CustomParameters> = () =>
    ({} as CustomParameters),
  // eslint-disable-next-line no-new-func
  onStart: OnStartCallback<CustomParameters> = Function() as any,
  // eslint-disable-next-line no-new-func
  onFinish: OnFinishCallback<CustomParameters> = Function() as any
) => async (
  lambdaEvent: LambdaOriginEdgeRequest,
  lambdaContext: any
): Promise<LambdaOriginEdgeResponse> => {
  const startTime = Date.now()

  try {
    const customParameters = await getCustomParameters(
      lambdaEvent,
      lambdaContext
    )

    const req = await createRequest<
      CustomParameters & { requestStartTime: number }
    >(lambdaEvent, {
      ...customParameters,
      requestStartTime: lambdaEvent.requestStartTime,
    })
    const res = createResponse()

    onStart(startTime, req, res)

    try {
      await handler(req, res)

      const { status, headers, body } = await finalizeResponse(res)

      const result: LambdaOriginEdgeResponse = {
        httpStatus: status,
        httpStatusText: getHttpStatusText(status),
        headers: headers.map(([key, value]) => ({
          key,
          value,
        })),
        body: Buffer.from(body).toString('base64'),
      }

      onFinish(Date.now(), req, res)

      return result
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(getDebugErrorMessage(error))

      const result: LambdaOriginEdgeResponse = {
        httpStatus: 500,
        httpStatusText: getHttpStatusText(500),
        headers: [],
        body: getSafeErrorMessage(error),
      }

      onFinish(Date.now(), req, res, error)

      return result
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(getDebugErrorMessage(error))

    return {
      httpStatus: 500,
      httpStatusText: getHttpStatusText(500),
      headers: [],
      body: getSafeErrorMessage(error),
    }
  }
}

export default wrapApiHandler
