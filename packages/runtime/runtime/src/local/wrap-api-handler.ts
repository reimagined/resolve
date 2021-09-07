import contentDisposition from 'content-disposition'
import cookie from 'cookie'
import mimeTypes from 'mime-types'
import getRawBody from 'raw-body'

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

const wrapHeadersCaseInsensitive = (headersMap: Record<string, any>) =>
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

const createRequest = async (expressReq: any, customParameters: any) => {
  let expressReqError = null

  const headers = wrapHeadersCaseInsensitive(expressReq.headers)
  const cookies =
    headers.cookie != null && headers.cookie.constructor === String
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

  const req = Object.create(null)

  const reqProperties = {
    adapter: 'express',
    method: expressReq.method,
    query: expressReq.query,
    path: expressReq.path,
    headers: expressReq.headers,
    cookies,
    body,
    ...customParameters,
  }

  for (const name of Object.keys(reqProperties)) {
    Object.defineProperty(req, name, {
      enumerable: true,
      get: () => reqProperties[name],
      set: () => {
        throw new Error(`Request parameters can't be modified`)
      },
    })
  }

  if (expressReqError != null) {
    throw expressReqError
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
    fieldName: any,
    option: any,
    types: any,
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

  const res = Object.create(null, { [INTERNAL]: { value: internalRes } })

  const defineResponseMethod = (name: string, value: any) =>
    Object.defineProperty(res, name, {
      enumerable: true,
      value,
    })

  defineResponseMethod(
    'cookie',
    (name: string, value: string, options?: cookie.CookieSerializeOptions) => {
      validateResponseOpened()
      const serializedCookie = cookie.serialize(name, value, options)

      internalRes.cookies.push(serializedCookie)
      return res
    }
  )

  defineResponseMethod(
    'clearCookie',
    (name: string, options?: cookie.CookieSerializeOptions) => {
      validateResponseOpened()
      const serializedCookie = cookie.serialize(name, '', {
        ...options,
        //TODO: look into that. Before it used 'expire' with string parameter
        expires: COOKIE_CLEAR_DATE,
      })

      internalRes.cookies.push(serializedCookie)
      return res
    }
  )

  defineResponseMethod('status', (code: number) => {
    validateResponseOpened()
    validateOptionShape('Status code', code, [Number])
    internalRes.status = code
    return res
  })

  defineResponseMethod('redirect', (path: string, code?: number) => {
    validateResponseOpened()
    validateOptionShape('Status code', code, [Number], true)
    validateOptionShape('Location path', path, [String])
    internalRes.headers['Location'] = path
    internalRes.status = code != null ? code : 302

    internalRes.closed = true
    return res
  })

  defineResponseMethod('getHeader', (searchKey: string) => {
    validateOptionShape('Header name', searchKey, [String])
    const normalizedKey = normalizeKey(searchKey, 'upper-dash-case')
    return internalRes.headers[normalizedKey]
  })

  defineResponseMethod('setHeader', (key: string, value: string) => {
    validateResponseOpened()
    validateOptionShape('Header name', key, [String])
    validateOptionShape('Header value', value, [String])

    internalRes.headers[normalizeKey(key, 'upper-dash-case')] = value
    return res
  })

  defineResponseMethod('text', (content: string, encoding?: BufferEncoding) => {
    validateResponseOpened()
    validateOptionShape('Text', content, [String])
    validateOptionShape('Encoding', encoding, [String], true)
    internalRes.body = Buffer.from(content, encoding)
    internalRes.closed = true
    return res
  })

  defineResponseMethod('json', (content: any) => {
    validateResponseOpened()
    internalRes.headers[normalizeKey('Content-Type', 'upper-dash-case')] =
      'application/json'
    internalRes.body = JSON.stringify(content)
    internalRes.closed = true
    return res
  })

  defineResponseMethod(
    'end',
    (content: string | Buffer = '', encoding?: BufferEncoding) => {
      validateResponseOpened()
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)
      internalRes.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content

      internalRes.closed = true
      return res
    }
  )

  defineResponseMethod(
    'file',
    (content: string | Buffer, filename: string, encoding?: BufferEncoding) => {
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
    }
  )

  return Object.freeze(res)
}

const wrapApiHandler = (handler: any, getCustomParameters?: Function) => async (
  expressReq: any,
  expressRes: any
) => {
  try {
    const customParameters =
      typeof getCustomParameters === 'function'
        ? await getCustomParameters(expressReq, expressRes)
        : {}

    const req = await createRequest(expressReq, customParameters)
    const res = createResponse()

    await handler(req, res)

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
