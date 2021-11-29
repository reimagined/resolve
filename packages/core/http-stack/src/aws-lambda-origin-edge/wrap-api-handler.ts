import { INTERNAL } from '../constants'
import getHttpStatusText from '../get-http-status-text'
import createResponse from '../create-response'
import normalizeKey from '../normalize-key'
import createRequest from './create-request'
import type {
  LambdaOriginEdgeRequest,
  HttpRequest,
  HttpResponse,
  LambdaOriginEdgeResponse,
} from '../types'

const wrapApiHandler = <
  CustomParameters extends { lambdaOriginEdgeStartTime: number } & Record<
    string | symbol,
    any
  > = { lambdaOriginEdgeStartTime: number }
>(
  handler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void>,
  getCustomParameters?: (
    lambdaEvent: LambdaOriginEdgeRequest,
    lambdaContext: any
  ) => Promise<CustomParameters>,
  onStart: (timestamp: number) => void = Function() as any,
  onFinish: (timestamp: number, error?: any) => void = Function() as any
) => async (
  lambdaEvent: LambdaOriginEdgeRequest,
  lambdaContext: any,
  lambdaCallback?: any
) => {
  onStart(Date.now())

  let result: LambdaOriginEdgeResponse

  try {
    const customParameters =
      getCustomParameters == null
        ? ({
            lambdaOriginEdgeStartTime: lambdaEvent.requestStartTime,
          } as CustomParameters)
        : await getCustomParameters(lambdaEvent, lambdaContext)

    const req = await createRequest<CustomParameters>(
      lambdaEvent,
      customParameters
    )
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

    result = {
      httpStatus: statusCode,
      httpStatusText: getHttpStatusText(statusCode),
      headers: headers.map(([key, value]) => ({
        key,
        value,
      })),
      body,
    }

    onFinish(Date.now())
  } catch (error) {
    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    // eslint-disable-next-line no-console
    console.error(outError)

    result = {
      httpStatus: 500,
      httpStatusText: getHttpStatusText(500),
      headers: [],
      body: '',
    }

    onFinish(Date.now(), error)
  }

  if (typeof lambdaCallback === 'function') {
    return lambdaCallback(null, result)
  } else {
    return result
  }
}

export default wrapApiHandler
