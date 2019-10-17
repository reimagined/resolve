import unfetch from 'unfetch'

import resolveChunk from '../dist/common/client/client-chunk'

import getOrigin from './get_origin'

const validate = {
  isAbsoluteUrl: value => /:\/\//i.test(value),
  string: (value, name) => {
    if (!(value != null && value.constructor === String)) {
      // eslint-disable-next-line
      console.error(value)
      throw new Error(`${name} must be a string`)
    }
  },
  leadingSlash: (value, name) => {
    if (!/^\//i.test(value)) {
      // eslint-disable-next-line
      console.error(value)
      throw new Error(`${name} must have leading "/"`)
    }
  }
}

const getRootBasedUrl = (origin, rootPath, path) => {
  validate.string(path, 'Path')

  if (validate.isAbsoluteUrl(path)) {
    return path
  }

  validate.leadingSlash(path, 'Path')

  return `${origin}${rootPath ? `/${rootPath}` : ''}${path}`
}

export class ApiError extends Error {
  constructor(error) {
    super()
    for (let key in error) {
      if (!error.hasOwnProperty(key)) {
        continue
      }
      this[key] = error[key]
    }
  }
}

export class FetchError extends ApiError {
  constructor(error) {
    super(error)
    this.name = 'FetchError'
  }
}

export class HttpError extends ApiError {
  constructor(error) {
    super(error)
    this.name = 'HttpError'
  }
}

export const temporaryErrorHttpCodes = [
  408, // Request Timeout
  429, // Too Many Requests
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  507, // Insufficient Storage
  509, // Bandwidth Limit Exceeded
  521, // Web Server Is Down
  522, // Connection Timed Out
  523, // Origin Is Unreachable
  524 // A Timeout Occurred
]

const doFetch = (...args) => {
  try {
    return fetch(...args)
  } catch (err) {
    return unfetch(...args)
  }
}

const validateStatus = async response => {
  // eslint-disable-next-line eqeqeq
  if (temporaryErrorHttpCodes.find(code => code == response.status)) {
    throw new FetchError({
      code: response.status,
      message: await response.text()
    })
  }
}

const createApi = () => {
  const rootPath = resolveChunk.rootPath
  const origin = getOrigin()

  const request = async (url, body) => {
    const rootBasedUrl = getRootBasedUrl(origin, rootPath, url)
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }

    const response = await doFetch(rootBasedUrl, options)
    return response
  }

  return {
    async sendCommand({ commandType, aggregateId, aggregateName, payload }) {
      let response, result
      try {
        response = await request('/api/commands', {
          type: commandType,
          aggregateId,
          aggregateName,
          payload
        })
      } catch (error) {
        throw new FetchError(error)
      }

      await validateStatus(response)

      if (!response.ok) {
        throw new HttpError({
          code: response.status,
          message: await response.text()
        })
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error)
      }

      return result
    },

    async getSubscribeAdapterOptions(adapterName) {
      let response, result
      try {
        response = await request('/api/subscribe', {
          origin,
          rootPath,
          adapterName
        })
      } catch (error) {
        throw new FetchError(error)
      }

      await validateStatus(response)

      if (!response.ok) {
        throw new HttpError({
          code: response.status,
          message: await response.text()
        })
      }

      try {
        result = await response.json()
      } catch (error) {
        throw new HttpError(error)
      }

      return result
    },

    async request({ url, body }) {
      return request(url, body)
    }
  }
}

export default createApi
