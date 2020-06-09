import http from 'http'
import https from 'https'
import { URL } from 'url'

function prepareBody(request) {
  return new Promise((resolve, reject) => {
    let chunks = []
    request
      .on('data', chunk => {
        chunks.push(chunk)
      })
      .on('end', () => {
        request.body = Buffer.concat(chunks)
        chunks = null
        resolve()
      })
      .on('error', error => {
        reject(error)
      })
  })
}

async function mainHandler(hostObject, request, response) {
  try {
    await prepareBody(request)

    request.hostObject = hostObject

    switch (request.method) {
      case 'POST': {
        return await handler(request, response)
      }
      default: {
        response.statusCode = 422
        response.end()
      }
    }
  } catch (error) {
    response.statusCode = !isNaN(+error.code) ? +error.code : 500
    response.end(error.stack)
  }
}

async function handler(request, response) {
  const { method, args } = JSON.parse(request.body)

  const callback = request.hostObject[method]
  if (callback == null) {
    response.statusCode = 422
    response.end(`Unsupported method = ${method}`)
    return
  }

  let result = await callback(...args)
  if (result == null) {
    result = null
  }

  response.statusCode = 200
  response.end(JSON.stringify(result, null, 2))
}

const createServer = async ({ address, hostObject }) => {
  const parsedUrl = new URL(address)

  const [serverFactory, defaultPort] =
    parsedUrl.protocol === 'https:'
      ? [https, 443]
      : parsedUrl.protocol === 'http:'
      ? [http, 80]
      : null

  const port = parsedUrl.port != null ? parsedUrl.port : defaultPort

  if (serverFactory == null) {
    throw new Error(`Invalid protocol ${parsedUrl.protocol}`)
  }

  const server = serverFactory.createServer(mainHandler.bind(null, hostObject))

  server.listen(port)

  return () => {
    const serverClosePromise = new Promise((resolve, reject) => {
      server.close(error => (error == null ? resolve() : reject(error)))
    })

    let hostObjectDisposePromise = Promise.resolve()

    if (typeof hostObject.dispose === 'function') {
      hostObjectDisposePromise = hostObject.dispose()
    }

    return Promise.all([serverClosePromise, hostObjectDisposePromise])
  }
}

export default createServer
