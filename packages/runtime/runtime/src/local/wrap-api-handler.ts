import contentDisposition from 'content-disposition'
import cookie from 'cookie'
import mimeTypes from 'mime-types'
import getRawBody from 'raw-body'
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express'
import type { IncomingHttpHeaders } from 'http'
import type {
  HttpRequest,
  HttpResponse,
  ResolveRequest,
  ResolveResponse,
} from '../common/types'

const COOKIE_CLEAR_DATE = new Date(0)
const INTERNAL = Symbol('INTERNAL')

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

const createRequest = async (
  expressReq: ExpressRequest,
  customParameters: Record<string, any>
) => {
  const headers = wrapHeadersCaseInsensitive(expressReq.headers)
  const cookies =
    headers.cookie != null && typeof headers.cookie === 'string'
      ? cookie.parse(headers.cookie)
      : {}

  const [contentType, optionsEntry] = headers.hasOwnProperty('Content-Type')
    ? String(headers['Content-Type'])
        .split(';')
        .map((value) => value.trim().toLowerCase())
    : []

  let charset = null
  if (optionsEntry != null && optionsEntry.startsWith('charset=')) {
    charset = optionsEntry.substring('charset='.length)
  }

  if (charset == null) {
    const mimeCharset =
      contentType != null ? mimeTypes.charset(contentType) : null
    charset = !!mimeCharset ? mimeCharset : 'latin1'
  }

  const body = headers.hasOwnProperty('Content-Length')
    ? await getRawBody(expressReq, {
        length: headers['Content-Length'],
        encoding: charset,
      })
    : null

  const req: HttpRequest = {
    adapter: 'express',
    method: expressReq.method,
    query: expressReq.query,
    path: expressReq.path,
    headers: expressReq.headers,
    cookies,
    body,
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
          .map((type: any) => type.name)
          .join(', ')}`
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
        //TODO: look into that. Before it used 'expire' with string parameter
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

const wrapApiHandler = (
  handler: (req: ResolveRequest, res: ResolveResponse) => Promise<void>,
  getCustomParameters?: Function
) => async (expressReq: ExpressRequest, expressRes: ExpressResponse) => {
  try {
    const customParameters =
      typeof getCustomParameters === 'function'
        ? await getCustomParameters(expressReq, expressRes)
        : {}

    const req = await createRequest(expressReq, customParameters)
    const res = createResponse()

    //TODO: explicitly set resolve to req object instead of customParameters? Or write a templated getCustomParameters
    await handler(req as ResolveRequest, res)

    const { status, headers, cookies, body } = res[INTERNAL]
    expressRes.status(status)
    headers['Set-Cookie'] = cookies
    expressRes.set(headers)
    expressRes.end(body)
  } catch (error) {
    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    // eslint-disable-next-line no-console
    console.error(outError)

    expressRes.status(500).end('')
  }
}

export default wrapApiHandler
