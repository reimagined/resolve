import cookie from 'cookie'

import type { InternalResponse, HttpResponse } from './types'
import {
  INTERNAL,
  CONTENT_DISPOSITION,
  CONTENT_TYPE,
  COOKIE_CLEAR_DATE,
  LOCATION,
} from './constants'
import validateResponseOpened from './validate-response-opened'
import validateOptionShape from './validate-option-shape'
import putHeader from './put-header'
import normalizeKey from './normalize-key'
import contentDisposition from 'content-disposition'

const createResponse = (): HttpResponse => {
  const internalRes: InternalResponse = {
    status: 200,
    headers: [],
    cookies: [],
    varyHeaderKeys: new Set<string>(),
    body: '',
    closed: false,
  }

  const res: HttpResponse = {
    [INTERNAL]: internalRes,
    cookie: (name, value, options) => {
      validateResponseOpened(internalRes)
      const serializedCookie = cookie.serialize(name, value, options)

      internalRes.cookies.push(serializedCookie)
      return res
    },
    clearCookie: (name, options) => {
      validateResponseOpened(internalRes)
      const serializedCookie = cookie.serialize(name, '', {
        ...options,
        expires: COOKIE_CLEAR_DATE,
      })

      internalRes.cookies.push(serializedCookie)
      return res
    },
    status: (code) => {
      validateResponseOpened(internalRes)
      validateOptionShape('Status code', code, [Number])

      internalRes.status = code
      return res
    },
    redirect: (path, code) => {
      validateResponseOpened(internalRes)
      validateOptionShape('Status code', code, [Number], true)
      validateOptionShape('Location path', path, [String])

      putHeader(internalRes.headers, LOCATION, path)

      internalRes.status = code != null ? code : 302
      internalRes.closed = true
      return res
    },
    getHeader: (key) => {
      validateOptionShape('Header name', key, [String])

      const normalizedKey = normalizeKey(key, 'upper-dash-case')

      const header = internalRes.headers.find(([key]) => key === normalizedKey)

      return header == null ? null : header[1]
    },
    setHeader: (key, value) => {
      validateResponseOpened(internalRes)
      validateOptionShape('Header name', key, [String])
      validateOptionShape('Header value', value, [String])

      putHeader(internalRes.headers, key, value)

      return res
    },
    addVaryHeader: (key) => {
      const normalizedKey = normalizeKey(key, 'upper-dash-case')
      internalRes.varyHeaderKeys.add(normalizedKey)

      return res
    },
    text: (content, encoding) => {
      validateResponseOpened(internalRes)
      validateOptionShape('Text', content, [String])
      validateOptionShape('Encoding', encoding, [String], true)

      internalRes.body = Buffer.from(content, encoding)
      internalRes.closed = true
      return res
    },
    json: (content) => {
      validateResponseOpened(internalRes)

      putHeader(internalRes.headers, CONTENT_TYPE, 'application/json')

      internalRes.body = JSON.stringify(content)
      internalRes.closed = true
      return res
    },
    end: (content = '', encoding) => {
      validateResponseOpened(internalRes)
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)

      internalRes.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content
      internalRes.closed = true
      return res
    },
    file: (content, filename, encoding) => {
      validateResponseOpened(internalRes)
      validateOptionShape('Content', content, [String, Buffer])
      validateOptionShape('Encoding', encoding, [String], true)

      internalRes.body =
        content.constructor === String
          ? Buffer.from(content, encoding)
          : content

      putHeader(
        internalRes.headers,
        CONTENT_DISPOSITION,
        contentDisposition(filename)
      )

      internalRes.closed = true
      return res
    },
  }
  return res
}

export default createResponse
