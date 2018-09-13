import sinon from 'sinon'

import wrapApiHandler from '../src'

describe('API handler wrapper for express.js', () => {
  let lambdaEvent, lambdaContext, lambdaCallback, getCustomParams

  beforeEach(() => {
    getCustomParams = sinon.stub().callsFake(() => ({ param: 'value' }))

    lambdaEvent = Object.create(null, {
      headers: {
        value: {
          'header-name-1': 'header-value-1',
          'header-name-2': 'header-value-2',
          cookie: 'cookie-content',
          host: 'host-content'
        },
        enumerable: true
      },
      path: {
        value: 'PATH_INFO',
        enumerable: true
      },
      body: {
        value: 'BODY_CONTENT',
        enumerable: true
      },
      queryStringParameters: {
        value: {
          'query-name-1': 'query-value-1',
          'query-name-2': 'query-value-2'
        },
        enumerable: true
      },
      httpMethod: {
        value: 'GET',
        enumerable: true
      }
    })
    lambdaContext = null
    lambdaCallback = sinon.stub()
  })

  afterEach(() => {
    getCustomParams = null
    lambdaEvent = null
    lambdaContext = null
    lambdaCallback = null
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
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveClientRequestBody(null)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })

  it('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveClientRequestBody([
      Buffer.from('Body partition one'),
      Buffer.from('Body partition two')
    ])
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })

  it('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, getCustomParams)
    resolveClientRequestBody(null)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })

  it('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, getCustomParams)
    resolveClientRequestBody(null)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })

  it('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, getCustomParams)
    resolveClientRequestBody(null)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })

  it('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, getCustomParams)
    resolveClientRequestBody(null)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })

  it('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, getCustomParams)
    resolveClientRequestBody(null)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()
  })
})
