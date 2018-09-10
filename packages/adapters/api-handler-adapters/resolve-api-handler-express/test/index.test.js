import sinon from 'sinon'

import wrapApiHandler from '../src'

describe('API handler wrapper for express.js', () => {
  let expressReq, expressRes, clientRequestBodyPromise, resolveClientRequestBody
  const resolveApiPath = 'RESOLVE-API-PATH'

  beforeEach(() => {
    clientRequestBodyPromise = new Promise(
      resolve => (resolveClientRequestBody = resolve)
    )

    expressReq = Object.create(null, {
      on: {
        value: sinon.stub().callsFake((event, callback) => {
          if (event === 'data') {
            clientRequestBodyPromise.then(
              bodyChunks =>
                Array.isArray(bodyChunks) ? bodyChunks.map(callback) : null,
              () => null
            )
          } else if (event === 'end') {
            clientRequestBodyPromise.then(callback, callback)
          } else if (event === 'error') {
            clientRequestBodyPromise.catch(callback)
          }
        }),
        enumerable: true
      },
      originalUrl: {
        value: 'ORIGINAL-URL',
        enumerable: true
      },
      protocol: {
        value: 'HTTP-LIKE-PROTOCOL',
        enumerable: true
      },
      method: {
        value: 'HTTP-VERB',
        enumerable: true
      },
      query: {
        value: {
          'query-name-1': 'query-value-1',
          'query-name-2': 'query-value-2'
        },
        enumerable: true
      },
      path: {
        value: 'PATH_INFO',
        enumerable: true
      },
      headers: {
        value: {
          'header-name-1': 'header-value-1',
          'header-name-2': 'header-value-2',
          cookie: 'cookie-content',
          host: 'host-content'
        },
        enumerable: true
      }
    })

    expressRes = {
      status: sinon.stub().callsFake(() => expressRes),
      append: sinon.stub().callsFake(() => expressRes),
      end: sinon.stub().callsFake(() => expressRes)
    }
  })

  afterEach(() => {
    clientRequestBodyPromise = null
    resolveClientRequestBody = null
    expressReq = null
    expressRes = null
  })

  const extractInvocationInfo = sinonStub => {
    const result = { callCount: sinonStub.callCount, callsInfo: [] }
    for (let idx = 0; idx < sinonStub.callCount; idx++) {
      const { args, returnValue } = sinonStub.getCall(idx)
      result.callsInfo[idx] = { args, returnValue }
    }
    return result
  }

  const apiJsonHandler = async (req, res) => {
    res.setHeader('One-Header-Name', 'One-Header-Value')
    res.setHeader('Two-Header-Name', 'Two-Header-Value')
    res.cookie('One-Cookie-Name', 'One-Cookie-Value')
    res.cookie('Two-Cookie-Name', 'Two-Cookie-Value')
    res.clearCookie('Two-Cookie-Name')
    const existingHeader = res.getHeader('Two-Header-Name')
    const missingHeader = res.getHeader('Missing-Header-Name')
    res.json({
      ...req,
      existingHeader,
      missingHeader
    })
  }

  const apiTextHandler = async (req, res) => {
    res.setHeader('One-Header-Name', 'One-Header-Value')
    res.setHeader('Two-Header-Name', 'Two-Header-Value')
    res.cookie('One-Cookie-Name', 'One-Cookie-Value')
    res.cookie('Two-Cookie-Name', 'Two-Cookie-Value')
    res.clearCookie('Two-Cookie-Name')
    const existingHeader = res.getHeader('Two-Header-Name')
    const missingHeader = res.getHeader('Missing-Header-Name')
    res.text(
      JSON.stringify({
        ...req,
        existingHeader,
        missingHeader
      })
    )
  }

  const apiCustomHandler = async (req, res) => {
    res.setHeader('One-Header-Name', 'One-Header-Value')
    res.setHeader('Two-Header-Name', 'Two-Header-Value')
    res.cookie('One-Cookie-Name', 'One-Cookie-Value')
    res.cookie('Two-Cookie-Name', 'Two-Cookie-Value')
    res.clearCookie('Two-Cookie-Name')
    const existingHeader = res.getHeader('Two-Header-Name')
    const missingHeader = res.getHeader('Missing-Header-Name')

    const result = JSON.stringify({
      ...req,
      existingHeader,
      missingHeader
    })

    res.end(result, 'utf8')
  }

  const apiFileHandler = async (req, res) => {
    res.setHeader('One-Header-Name', 'One-Header-Value')
    res.setHeader('Two-Header-Name', 'Two-Header-Value')
    res.cookie('One-Cookie-Name', 'One-Cookie-Value')
    res.cookie('Two-Cookie-Name', 'Two-Cookie-Value')
    res.clearCookie('Two-Cookie-Name')
    const existingHeader = res.getHeader('Two-Header-Name')
    const missingHeader = res.getHeader('Missing-Header-Name')

    const result = JSON.stringify({
      ...req,
      existingHeader,
      missingHeader
    })

    res.file(result, 'synthetic-filename.txt', 'utf8')
  }

  const apiRedirectHandler = async (req, res) => {
    res.redirect('REDIRECT-PATH', 307)
    res.redirect('REDIRECT-PATH')
    res.status(307)
    res.text('Result text')
    res.status(307)
  }

  const apiThrowHandler = async () => {
    throw new Error('Custom error')
  }

  it('should work with primitive JSON handler with GET client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, resolveApiPath)
    resolveClientRequestBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })

  it('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, resolveApiPath)
    resolveClientRequestBody([
      Buffer.from('Body partition one'),
      Buffer.from('Body partition two')
    ])
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })

  it('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, resolveApiPath)
    resolveClientRequestBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })

  it('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, resolveApiPath)
    resolveClientRequestBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })

  it('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, resolveApiPath)
    resolveClientRequestBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })

  it('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, resolveApiPath)
    resolveClientRequestBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })

  it('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, resolveApiPath)
    resolveClientRequestBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.append)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()
  })
})
