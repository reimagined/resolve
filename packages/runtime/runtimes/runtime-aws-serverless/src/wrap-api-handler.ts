import binaryCase from 'binary-case'
import contentDisposition from 'content-disposition'
import cookie from 'cookie'
import { parse as parseQuery } from 'qs'

import { getHttpStatusText } from '@resolve-js/runtime-base'

import type { Monitoring } from '@resolve-js/core'
import type { IncomingHttpHeaders } from 'http'
import type {
  HttpRequest,
  HttpResponse,
  ResolveRequest,
  ResolveResponse,
} from '@resolve-js/runtime-base'

const COOKIE_CLEAR_DATE = new Date(0)
const INTERNAL = Symbol('INTERNAL')
const isTrailingBracket = /\[\]$/

const normalizeKey = (key: string, mode: string) => {
  switch (mode) {
    case 'upper-dash-case':
      return key
        .toLowerCase()
        .split(/-/g)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join('-')
    case 'dash-case':
      return `${key.charAt(0).toUpperCase()}${key.slice(1).toLowerCase()}`
    case 'lower-case':
      return key.toLowerCase()
    default:
      throw new Error(`Wrong normalize mode ${mode}`)
  }
}

const wrapHeadersCaseInsensitive = (
  headersMap: IncomingHttpHeaders
): Record<string, any> =>
  Object.create(
    Object.prototype,
    Object.keys(headersMap).reduce((acc: Record<string, any>, key) => {
      const value = headersMap[key]
      const [upperDashKey, dashKey, lowerKey] = [
        normalizeKey(key, 'upper-dash-case'),
        normalizeKey(key, 'dash-case'),
        normalizeKey(key, 'lower-case'),
      ]

      acc[upperDashKey] = { value, enumerable: true }
      if (upperDashKey !== dashKey) {
        acc[dashKey] = { value, enumerable: false }
      }
      acc[lowerKey] = { value, enumerable: false }

      return acc
    }, {})
  )

const prepareHeaders = (
  headers: Array<{ key: string; value: any }>,
  isLambdaEdgeRequest: boolean
) => {
  return isLambdaEdgeRequest
    ? headers.reduce((acc: Record<string, any>, { key, value }) => {
        acc[key] = value
        return acc
      }, {})
    : headers
}

const prepareQuery = (
  {
    multiValueQueryStringParameters,
    querystring,
  }: {
    multiValueQueryStringParameters: Record<string, any>
    querystring: string
  },
  isLambdaEdgeRequest: boolean
) => {
  if (isLambdaEdgeRequest) {
    const query = parseQuery(querystring)
    return query
  } else {
    const query =
      multiValueQueryStringParameters != null
        ? multiValueQueryStringParameters
        : {}

    for (const [queryKey, queryValue] of Object.entries(query)) {
      if (isTrailingBracket.test(queryKey)) {
        delete query[queryKey]
        query[queryKey.replace(isTrailingBracket, '')] = queryValue
      } else if (queryValue.length === 1) {
        query[queryKey] = queryValue[0]
      }
    }
    return query
  }
}

const prepareBody = (body: string, isLambdaEdgeRequest: boolean) => {
  return isLambdaEdgeRequest ? Buffer.from(body, 'base64').toString() : body
}

const preparePath = (
  { path, uri }: { path: string; uri: string },
  isLambdaEdgeRequest: boolean
) => {
  return isLambdaEdgeRequest ? uri : path
}

const createRequest = async (
  lambdaEvent: any,
  customParameters: Record<string, any>
) => {
  let {
    path: rawPath,
    uri,
    httpMethod,
    headers: rawHeaders,
    multiValueQueryStringParameters,
    querystring,
    body: rawBody,
  } = lambdaEvent

  const isLambdaEdgeRequest = Array.isArray(rawHeaders)

  const query = prepareQuery(
    {
      multiValueQueryStringParameters,
      querystring,
    },
    isLambdaEdgeRequest
  )

  const body = prepareBody(rawBody, isLambdaEdgeRequest)

  let path = preparePath({ path: rawPath, uri }, isLambdaEdgeRequest)

  const {
    'x-proxy-headers': proxyHeadersString,
    ...originalHeaders
  } = prepareHeaders(rawHeaders, isLambdaEdgeRequest)

  if (proxyHeadersString != null) {
    for (const [headerName, headerValue] of Object.entries(
      JSON.parse(proxyHeadersString)
    )) {
      const normalizedHeaderName = normalizeKey(headerName, 'upper-dash-case')
      if (headerName.toLowerCase() === 'x-uri') {
        path = headerValue as string
      } else {
        for (const originalHeaderName of Object.keys(originalHeaders)) {
          if (
            normalizeKey(originalHeaderName, 'upper-dash-case') ===
            normalizedHeaderName
          ) {
            delete originalHeaders[originalHeaderName]
          }
        }

        originalHeaders[normalizedHeaderName] = headerValue
      }
    }
  }

  const headers = wrapHeadersCaseInsensitive(originalHeaders)
  const cookies =
    headers.cookie != null && typeof headers.cookie === 'string'
      ? cookie.parse(headers.cookie)
      : {}

  const clientIp = headers['X-Forwarded-For']

  const req: HttpRequest = {
    isLambdaEdgeRequest,
    adapter: 'awslambda',
    method: httpMethod,
    query,
    path,
    headers,
    cookies,
    body,
    clientIp,
    ...customParameters,
  }

  return Object.freeze(req)
}

const createResponse = () => {
  type InternalRes = {
    status: number
    headers: Record<string, any>
    cookies: any[]
    body: string | Buffer
    closed: boolean
  }

  const internalRes: InternalRes = {
    status: 200,
    headers: {},
    cookies: [],
    body: '',
    closed: false,
  }

  const validateResponseOpened = () => {
    if (internalRes.closed) {
      throw new Error('Response already sent')
    }
  }

  const validateOptionShape = (
    fieldName: string,
    option: any,
    types: any[],
    nullable = false
  ) => {
    const isValidValue =
      (nullable && option == null) ||
      !(
        option == null ||
        !types.reduce(
          (acc: boolean, type: any) => acc || option.constructor === type,
          false
        )
      )
    if (!isValidValue) {
      throw new Error(
        `Variable "${fieldName}" should be one of following types: ${types
          .map((item) => (item === Buffer ? 'Buffer' : `${item}`))
          .join(', ')}. Received option: ${option}`
      )
    }
  }

  const res: HttpResponse & { [INTERNAL]: InternalRes } = {
    [INTERNAL]: internalRes,
    cookie: (
      name: string,
      value: string,
      options?: cookie.CookieSerializeOptions
    ) => {
      validateResponseOpened()
      const serializedCookie = cookie.serialize(name, value, options)

      internalRes.cookies.push(serializedCookie)
      return res
    },
    clearCookie: (name: string, options?: cookie.CookieSerializeOptions) => {
      validateResponseOpened()
      const serializedCookie = cookie.serialize(name, '', {
        ...options,
        expires: COOKIE_CLEAR_DATE,
      })

      internalRes.cookies.push(serializedCookie)
      return res
    },
    status: (code: number) => {
      validateResponseOpened()
      validateOptionShape('Status code', code, [Number])
      internalRes.status = code
      return res
    },
    redirect: (path: string, code?: number) => {
      validateResponseOpened()
      validateOptionShape('Status code', code, [Number], true)
      validateOptionShape('Location path', path, [String])
      internalRes.headers['Location'] = path
      internalRes.status = code != null ? code : 302

      internalRes.closed = true
      return res
    },
    getHeader: (searchKey: string) => {
      validateOptionShape('Header name', searchKey, [String])
      const normalizedKey = normalizeKey(searchKey, 'upper-dash-case')
      return internalRes.headers[normalizedKey]
    },
    setHeader: (key: string, value: string) => {
      validateResponseOpened()
      validateOptionShape('Header name', key, [String])
      validateOptionShape('Header value', value, [String])

      internalRes.headers[normalizeKey(key, 'upper-dash-case')] = value
      return res
    },
    text: (content: string, encoding?: BufferEncoding) => {
      validateResponseOpened()
      validateOptionShape('Text', content, [String])
      validateOptionShape('Encoding', encoding, [String], true)
      internalRes.body = Buffer.from(content, encoding)
      internalRes.closed = true
      return res
    },
    json: (content: any) => {
      validateResponseOpened()
      internalRes.headers[normalizeKey('Content-Type', 'upper-dash-case')] =
        'application/json'
      internalRes.body = JSON.stringify(content)
      internalRes.closed = true
      return res
    },
    end: (content: string | Buffer = '', encoding?: BufferEncoding) => {
      validateResponseOpened()
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)
      internalRes.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content

      internalRes.closed = true
      return res
    },
    file: (
      content: string | Buffer,
      filename: string,
      encoding?: BufferEncoding
    ) => {
      validateResponseOpened()
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)
      internalRes.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content

      internalRes.headers['Content-Disposition'] = contentDisposition(filename)

      internalRes.closed = true
      return res
    },
  }

  return Object.freeze(res)
}

export const wrapApiHandler = (
  handler: (req: ResolveRequest, res: ResolveResponse) => Promise<void>,
  getCustomParameters?: Function,
  monitoring?: Monitoring
) => async (lambdaEvent: any, lambdaContext: any, lambdaCallback?: any) => {
  const startTimestamp = Date.now()

  if (monitoring != null) {
    monitoring.time('Execution', startTimestamp)
  }

  let pathMonitoring
  let result
  let isLambdaEdgeRequest
  let req
  let executionError
  try {
    const customParameters =
      typeof getCustomParameters === 'function'
        ? await getCustomParameters(lambdaEvent, lambdaContext, lambdaCallback)
        : {}

    req = await createRequest(lambdaEvent, customParameters)

    if (monitoring != null) {
      pathMonitoring = monitoring
        .group({ Path: req.path })
        .group({ Method: req.method })

      pathMonitoring.time('Execution', startTimestamp)
    }

    const res = createResponse()

    await handler(req as ResolveRequest, res)

    isLambdaEdgeRequest = req.isLambdaEdgeRequest

    const { status: statusCode, headers, cookies, body: bodyBuffer } = res[
      INTERNAL
    ]
    const body = bodyBuffer.toString()

    for (let idx = 0; idx < cookies.length; idx++) {
      headers[binaryCase('Set-cookie', idx) as string] = cookies[idx]
    }

    if (isLambdaEdgeRequest) {
      result = {
        httpStatus: statusCode,
        httpStatusText: getHttpStatusText(statusCode),
        headers: Object.entries(headers).map(([key, value]) => ({
          key,
          value,
        })),
        body: Buffer.from(bodyBuffer).toString('base64'),
      }
    } else {
      result = {
        statusCode,
        headers,
        body,
      }
    }
  } catch (error) {
    executionError = error

    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    // eslint-disable-next-line no-console
    console.error(outError)

    if (isLambdaEdgeRequest) {
      result = {
        httpStatus: 500,
        httpStatusText: getHttpStatusText(500),
        headers: [],
        body: '',
      }
    } else {
      result = {
        statusCode: 500,
        body: '',
      }
    }
  } finally {
    const endTimestamp = Date.now()

    if (pathMonitoring != null) {
      pathMonitoring.execution(executionError)
      pathMonitoring.timeEnd('Execution', endTimestamp)
    }

    monitoring?.timeEnd('Execution', endTimestamp)
  }

  if (typeof lambdaCallback === 'function') {
    return lambdaCallback(null, result)
  } else {
    return result
  }
}
