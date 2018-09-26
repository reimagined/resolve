import contentDisposition from 'content-disposition'
import cookie from 'cookie'

const COOKIE_CLEAR_DATE = new Date(0).toGMTString()
const INTERNAL = Symbol('INTERNAL')

const normalizeKey = (key, mode) => {
  switch (mode) {
    case 'upper-dash-case':
      return key
        .toLowerCase()
        .split(/-/g)
        .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join('-')
    case 'dash-case':
      return `${key.charAt(0).toUpperCase()}${key.slice(1).toLowerCase()}`
    case 'lower-case':
      return key.toLowerCase()
    default:
      throw new Error(`Wrong normalize mode ${mode}`)
  }
}

const wrapHeadersCaseInsensitive = headersMap =>
  Object.create(
    null,
    Object.keys(headersMap).reduce((acc, key) => {
      const value = headersMap[key]
      const [upperDashKey, dashKey, lowerKey] = [
        normalizeKey(key, 'upper-dash-case'),
        normalizeKey(key, 'dash-case'),
        normalizeKey(key, 'lower-case')
      ]

      acc[upperDashKey] = { value, enumerable: true }
      if (upperDashKey !== dashKey) {
        acc[dashKey] = { value, enumerable: false }
      }
      acc[lowerKey] = { value, enumerable: false }

      return acc
    }, {})
  )

const mergeResponseHeaders = responseHeaders => {
  const resultHeaders = {}
  for (const { key, value } of responseHeaders) {
    if (resultHeaders.hasOwnProperty(key)) {
      // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2 paragraph 4
      resultHeaders[key] = `${resultHeaders[key]}, ${value}`
    } else {
      resultHeaders[key] = value
    }
  }
  return resultHeaders
}

const createRequest = async (expressReq, customParameters) => {
  let expressReqError = null

  const body = await new Promise((resolve, reject) => {
    expressReq.on('error', error => {
      expressReqError = error
      reject(error)
    })
    const bodyChunks = []

    expressReq.on('data', chunk => {
      bodyChunks.push(chunk)
    })
    expressReq.on('end', () => {
      if (bodyChunks.length === 0) {
        return resolve(null)
      }

      const body = Buffer.concat(bodyChunks).toString()
      resolve(body)
    })
  })

  const headers = wrapHeadersCaseInsensitive(expressReq.headers)
  const cookies =
    headers.cookie != null && headers.cookie.constructor === String
      ? cookie.parse(headers.cookie)
      : {}

  const req = Object.create(null)

  const reqProperties = {
    adapter: 'express',
    method: expressReq.method,
    query: expressReq.query,
    path: expressReq.path,
    headers: expressReq.headers,
    cookies,
    body,
    ...customParameters
  }

  for (const name of Object.keys(reqProperties)) {
    Object.defineProperty(req, name, {
      enumerable: true,
      get: () => reqProperties[name],
      set: () => {
        throw new Error(`Request parameters can't be modified`)
      }
    })
  }

  if (expressReqError != null) {
    throw expressReqError
  }

  return Object.freeze(req)
}

const createResponse = () => {
  const internalRes = {
    status: 200,
    headers: [],
    body: '',
    closed: false
  }

  const validateResponseOpened = () => {
    if (internalRes.closed) {
      throw new Error('Response already sent')
    }
  }

  const validateOptionShape = (fieldName, option, types, nullable = false) => {
    const isValidValue =
      (nullable && option == null) ||
      !(
        option == null ||
        !types.reduce((acc, type) => acc || option.constructor === type, false)
      )
    if (!isValidValue) {
      throw new Error(
        `Variable "${fieldName}" should be one of following types: ${types.json(
          ', '
        )}`
      )
    }
  }

  const res = Object.create(null, { [INTERNAL]: { value: internalRes } })

  const defineResponseMethod = (name, value) =>
    Object.defineProperty(res, name, {
      enumerable: true,
      value
    })

  defineResponseMethod('cookie', (name, value, options) => {
    validateResponseOpened()
    const serializedCookie = cookie.serialize(name, value, options)
    internalRes.headers.push({ key: 'Set-Cookie', value: serializedCookie })
  })

  defineResponseMethod('clearCookie', (name, options) => {
    validateResponseOpened()
    const serializedCookie = cookie.serialize(name, '', {
      ...options,
      expire: COOKIE_CLEAR_DATE
    })
    internalRes.headers.push({ key: 'Set-Cookie', value: serializedCookie })
  })

  defineResponseMethod('status', code => {
    validateResponseOpened()
    validateOptionShape('Status code', code, [Number])
    internalRes.status = code
  })

  defineResponseMethod('redirect', (path, code) => {
    validateResponseOpened()
    validateOptionShape('Status code', code, [Number], true)
    validateOptionShape('Location path', path, [String])
    internalRes.headers.push({ key: 'Location', value: path })
    internalRes.status = code != null ? code : 302

    internalRes.closed = true
  })

  defineResponseMethod('getHeader', searchKey => {
    validateOptionShape('Header name', searchKey, [String])
    const normalizedKey = normalizeKey(searchKey, 'upper-dash-case')
    const header = internalRes.headers.find(({ key }) => key === normalizedKey)
    if (header == null) return null
    return header.value
  })

  defineResponseMethod('setHeader', (key, value) => {
    validateResponseOpened()
    validateOptionShape('Header name', key, [String])
    validateOptionShape('Header value', value, [String])

    internalRes.headers.push({
      key: normalizeKey(key, 'upper-dash-case'),
      value
    })
  })

  defineResponseMethod('text', (content, encoding) => {
    validateResponseOpened()
    validateOptionShape('Text', content, [String])
    validateOptionShape('Encoding', encoding, [String], true)
    internalRes.body = Buffer.from(content, encoding)
    internalRes.closed = true
  })

  defineResponseMethod('json', content => {
    validateResponseOpened()
    internalRes.body = JSON.stringify(content)
    internalRes.closed = true
  })

  defineResponseMethod('end', (content, encoding) => {
    validateResponseOpened()
    validateOptionShape('Content', content, [String, Buffer])
    validateOptionShape('Encoding', encoding, [String], true)
    internalRes.body =
      content.constructor === String ? Buffer.from(content, encoding) : content

    internalRes.closed = true
  })

  defineResponseMethod('file', (content, filename, encoding) => {
    validateResponseOpened()
    validateOptionShape('Content', content, [String, Buffer])
    validateOptionShape('Encoding', encoding, [String], true)
    internalRes.body =
      content.constructor === String ? Buffer.from(content, encoding) : content

    internalRes.headers.push({
      key: 'Content-Disposition',
      value: contentDisposition(filename)
    })

    internalRes.closed = true
  })

  return Object.freeze(res)
}

const wrapApiHandler = (handler, getCustomParameters) => async (
  expressReq,
  expressRes
) => {
  try {
    const customParameters =
      typeof getCustomParameters === 'function'
        ? await getCustomParameters(expressReq, expressRes)
        : {}

    const req = await createRequest(expressReq, customParameters)
    const res = createResponse()

    await handler(req, res)

    const { status, headers, body } = res[INTERNAL]
    expressRes.status(status)

    expressRes.set(mergeResponseHeaders(headers))

    expressRes.end(body)
  } catch (error) {
    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`

    expressRes.status(500).end(outError)
  }
}

export default wrapApiHandler
