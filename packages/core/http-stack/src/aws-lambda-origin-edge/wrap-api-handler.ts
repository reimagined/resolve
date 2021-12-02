import type {
  LambdaOriginEdgeRequest,
  HttpRequest,
  HttpResponse,
  LambdaOriginEdgeResponse,
} from '../types'
import { INTERNAL } from '../constants'
import normalizeKey from '../normalize-key'
import createRequest from './create-request'
import createResponse from '../create-response'
import getHttpStatusText from '../get-http-status-text'
import getSafeErrorMessage from '../get-safe-error-message'
import getDebugErrorMessage from '../get-debug-error-message'

const wrapApiHandler = <
  CustomParameters extends Record<string | symbol, any> = {
    lambdaOriginEdgeStartTime: number
  }
>(
  handler: (
    req: HttpRequest<CustomParameters & { lambdaOriginEdgeStartTime: number }>,
    res: HttpResponse
  ) => Promise<void>,
  getCustomParameters: (
    lambdaEvent: LambdaOriginEdgeRequest,
    lambdaContext: any
  ) => CustomParameters | Promise<CustomParameters> = () => ({} as any),
  // eslint-disable-next-line no-new-func
  onStart: (timestamp: number) => void = Function() as any,
  // eslint-disable-next-line no-new-func
  onFinish: (timestamp: number, error?: any) => void = Function() as any
) => async (
  lambdaEvent: LambdaOriginEdgeRequest,
  lambdaContext: any
): Promise<LambdaOriginEdgeResponse> => {
  onStart(Date.now())

  try {
    const customParameters = await getCustomParameters(
      lambdaEvent,
      lambdaContext
    )

    const req = await createRequest<
      CustomParameters & { lambdaOriginEdgeStartTime: number }
    >(lambdaEvent, {
      ...customParameters,
      lambdaOriginEdgeStartTime: lambdaEvent.requestStartTime,
    })
    const res = createResponse()

    await handler(req, res)

    const { status: statusCode, headers, cookies, body: bodyBuffer } = res[
      INTERNAL
    ]
    const body = Buffer.from(bodyBuffer).toString('base64')

    for (const cookieHeader of cookies) {
      headers.push([
        normalizeKey('Set-Cookie', 'upper-dash-case'),
        cookieHeader,
      ])
    }

    const result: LambdaOriginEdgeResponse = {
      httpStatus: statusCode,
      httpStatusText: getHttpStatusText(statusCode),
      headers: headers.map(([key, value]) => ({
        key,
        value,
      })),
      body,
    }

    onFinish(Date.now())

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

    onFinish(Date.now(), error)

    return result
  }
}

export default wrapApiHandler
