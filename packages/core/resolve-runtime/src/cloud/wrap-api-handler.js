import binaryCase from 'binary-case'
import contentDisposition from 'content-disposition'
import cookie from 'cookie'
import { parse as parseQuery } from 'query-string'
import { getReasonPhrase } from 'http-status-codes'

const COOKIE_CLEAR_DATE = new Date(0)
const createRequest = async (lambdaEvent, context, customParameters) => {
  const {
    uri,
    httpMethod,
    headers: originalHeaders,
    querystring,
    body,
  } = lambdaEvent
  const cookieHeader = originalHeaders.find(
    (item) => item.key.toLowerCase() === 'cookie'
  )
  const headers = originalHeaders
    .filter((item) => item !== cookieHeader)
    .reduce((acc, item) => {
      acc[item.key.toLowerCase()] = item.value
      return acc
    }, {})
  const cookies = cookieHeader != null ? cookie.parse(cookieHeader.value) : {}
  const query = parseQuery(querystring, { arrayFormat: 'bracket' })
  const req = {
    context,
    method: httpMethod,
    path: uri,
    query,
    headers,
    cookies,
    body: body != null ? Buffer.from(body, 'base64').toString() : null,
    ...customParameters,
  }
  Object.freeze(req)
  return req
}
const createResponse = () => {
  const internal = {
    status: 200,
    headers: {},
    cookies: [],
    body: '',
    closed: false,
  }
  const validateResponseOpened = () => {
    if (internal.closed) {
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
        `Variable "${fieldName}" should be one of following types: ${types.join(
          ', '
        )}`
      )
    }
  }
  const res = {
    INTERNAL: internal,
    cookie(name, value, options) {
      validateResponseOpened()
      const serializedCookie = cookie.serialize(name, value, options)
      internal.cookies.push(serializedCookie)
      return res
    },
    clearCookie(name, options) {
      validateResponseOpened()
      const serializedCookie = cookie.serialize(
        name,
        '',
        Object.assign(Object.assign({}, options), {
          expires: COOKIE_CLEAR_DATE,
        })
      )
      internal.cookies.push(serializedCookie)
      return res
    },
    status(code) {
      validateResponseOpened()
      validateOptionShape('Status code', code, [Number])
      internal.status = code
      return res
    },
    redirect(path, code) {
      validateResponseOpened()
      validateOptionShape('Status code', code, [Number], true)
      validateOptionShape('Location path', path, [String])
      internal.headers.Location = path
      internal.status = code != null ? code : 302
      internal.closed = true
      return res
    },
    getHeader(searchKey) {
      var _a
      validateOptionShape('Header name', searchKey, [String])
      return (_a = internal.headers[searchKey]) !== null && _a !== void 0
        ? _a
        : null
    },
    setHeader(key, value) {
      validateResponseOpened()
      validateOptionShape('Header name', key, [String])
      validateOptionShape('Header value', value, [String])
      internal.headers[key] = value
      return res
    },
    text(content, encoding) {
      validateResponseOpened()
      validateOptionShape('Text', content, [String])
      validateOptionShape('Encoding', encoding, [String], true)
      internal.body = Buffer.from(content, encoding)
      internal.closed = true
      return res
    },
    json(content) {
      validateResponseOpened()
      internal.headers['Content-Type'] = 'application/json'
      internal.body = JSON.stringify(content)
      internal.closed = true
      return res
    },
    end(content = '', encoding) {
      validateResponseOpened()
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)
      internal.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content
      internal.closed = true
      return res
    },
    file(content, filename, encoding) {
      validateResponseOpened()
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)
      internal.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content
      internal.headers['Content-Disposition'] = contentDisposition(filename)
      internal.closed = true
      return res
    },
  }
  Object.freeze(res)
  return res
}

const wrapClientApiHandler = async (
  handler,
  getCustomParameters,
  lambdaEvent,
  lambdaContext
) => {
  try {
    const customParameters =
      typeof getCustomParameters === 'function'
        ? await getCustomParameters(lambdaEvent, lambdaContext)
        : {}

    const req = await createRequest(
      lambdaEvent,
      lambdaContext,
      customParameters
    )
    const res = createResponse()
    await handler(req, res)
    const {
      status: httpStatus,
      headers: { ...internalHeaders },
      cookies,
      body: internalBody,
    } = res.INTERNAL

    const body = Buffer.from(internalBody).toString('base64')
    // TODO @IhostVlad binaryCase
    for (let idx = 0; idx < cookies.length; idx++) {
      internalHeaders[binaryCase('Set-cookie', idx)] = cookies[idx]
    }
    const headers = Object.entries(internalHeaders).map(([key, value]) => ({
      key,
      value,
    }))
    return {
      httpStatus,
      httpStatusText: getReasonPhrase(httpStatus),
      headers,
      body,
    }
  } catch (error) {
    const outError =
      error != null && error.stack != null
        ? `${error.stack}`
        : `Unknown error ${error}`
    // eslint-disable-next-line no-console
    console.error(outError)
    return {
      httpStatus: 500,
      httpStatusText: getReasonPhrase(500),
      body: '',
      headers: [],
    }
  }
}

const wrapApiHandler = (handler, getCustomParameters) =>
  wrapClientApiHandler.bind(null, handler, getCustomParameters)

export default wrapApiHandler
