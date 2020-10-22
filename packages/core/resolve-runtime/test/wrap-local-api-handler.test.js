import wrapApiHandler from '../src/local/wrap-api-handler'

describe('API handler wrapper for express.js', () => {
  let expressReq, expressRes, httpBodyPromise, resolveHttpBody, getCustomParams

  beforeEach(() => {
    httpBodyPromise = new Promise((resolve) => (resolveHttpBody = resolve))
    getCustomParams = () => ({ param: 'value' })

    expressReq = Object.create(null, {
      on: {
        value: (event, callback) => {
          if (event === 'data') {
            httpBodyPromise.then(
              (bodyChunks) =>
                Array.isArray(bodyChunks) ? bodyChunks.map(callback) : null,
              () => null
            )
          } else if (event === 'end') {
            httpBodyPromise.then(callback, callback)
          } else if (event === 'error') {
            httpBodyPromise.catch(callback)
          }
        },
        enumerable: true,
      },
      method: {
        value: 'HTTP-VERB',
        enumerable: true,
      },
      query: {
        value: {
          'query-name-1': 'query-value-1',
          'query-name-2': 'query-value-2',
        },
        enumerable: true,
      },
      path: {
        value: 'PATH_INFO',
        enumerable: true,
      },
      headers: {
        value: {
          'header-name-1': 'header-value-1',
          'header-name-2': 'header-value-2',
          cookie: 'cookie-content',
          host: 'host-content',
        },
        enumerable: true,
      },
    })

    expressRes = {
      status: jest.fn().mockImplementation(() => expressRes),
      set: jest.fn().mockImplementation(() => expressRes),
      end: jest.fn().mockImplementation(() => expressRes),
    }
  })

  afterEach(() => {
    getCustomParams = null
    httpBodyPromise = null
    resolveHttpBody = null
    expressReq = null
    expressRes = null
  })

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
      missingHeader,
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
        missingHeader,
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
      missingHeader,
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
      missingHeader,
    })

    res.file(result, 'synthetic-filename.txt', 'utf8')
  }

  const apiRedirectHandler = async (req, res) => {
    res.redirect('REDIRECT-PATH', 307)
  }

  const apiThrowHandler = async () => {
    throw new Error('Custom error')
  }

  const apiEmptyEndHandler = async (req, res) => {
    res.status(200)
    res.end()
  }

  const apiEmptyEndChainingHandler = async (req, res) => {
    res.status(200).end()
  }

  test('should work with primitive JSON handler with GET client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({
      'Content-Type': 'application/json',
      'One-Header-Name': 'One-Header-Value',
      'Set-Cookie': [
        'One-Cookie-Name=One-Cookie-Value',
        'Two-Cookie-Name=Two-Cookie-Value',
        'Two-Cookie-Name=',
      ],
      'Two-Header-Name': 'Two-Header-Value',
    })
    expect(expressRes.end).toBeCalledWith(
      JSON.stringify({
        adapter: 'express',
        method: 'HTTP-VERB',
        query: {
          'query-name-1': 'query-value-1',
          'query-name-2': 'query-value-2',
        },
        path: 'PATH_INFO',
        headers: {
          'header-name-1': 'header-value-1',
          'header-name-2': 'header-value-2',
          cookie: 'cookie-content',
          host: 'host-content',
        },
        cookies: {},
        body: null,
        param: 'value',
        existingHeader: 'Two-Header-Value',
      })
    )
  })

  test('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveHttpBody([
      Buffer.from('Body partition one'),
      Buffer.from('Body partition two'),
    ])
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({
      'Content-Type': 'application/json',
      'One-Header-Name': 'One-Header-Value',
      'Set-Cookie': [
        'One-Cookie-Name=One-Cookie-Value',
        'Two-Cookie-Name=Two-Cookie-Value',
        'Two-Cookie-Name=',
      ],
      'Two-Header-Name': 'Two-Header-Value',
    })
    expect(expressRes.end).toBeCalledWith(
      JSON.stringify({
        adapter: 'express',
        method: 'HTTP-VERB',
        query: {
          'query-name-1': 'query-value-1',
          'query-name-2': 'query-value-2',
        },
        path: 'PATH_INFO',
        headers: {
          'header-name-1': 'header-value-1',
          'header-name-2': 'header-value-2',
          cookie: 'cookie-content',
          host: 'host-content',
        },
        cookies: {},
        body: null,
        param: 'value',
        existingHeader: 'Two-Header-Value',
      })
    )
  })

  test('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({
      'One-Header-Name': 'One-Header-Value',
      'Set-Cookie': [
        'One-Cookie-Name=One-Cookie-Value',
        'Two-Cookie-Name=Two-Cookie-Value',
        'Two-Cookie-Name=',
      ],
      'Two-Header-Name': 'Two-Header-Value',
    })
    expect(expressRes.end).toBeCalledWith(
      Buffer.from(
        JSON.stringify({
          adapter: 'express',
          method: 'HTTP-VERB',
          query: {
            'query-name-1': 'query-value-1',
            'query-name-2': 'query-value-2',
          },
          path: 'PATH_INFO',
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            cookie: 'cookie-content',
            host: 'host-content',
          },
          cookies: {},
          body: null,
          param: 'value',
          existingHeader: 'Two-Header-Value',
        }),
        'utf8'
      )
    )
  })

  test('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({
      'One-Header-Name': 'One-Header-Value',
      'Set-Cookie': [
        'One-Cookie-Name=One-Cookie-Value',
        'Two-Cookie-Name=Two-Cookie-Value',
        'Two-Cookie-Name=',
      ],
      'Two-Header-Name': 'Two-Header-Value',
    })
    expect(expressRes.end).toBeCalledWith(
      Buffer.from(
        JSON.stringify({
          adapter: 'express',
          method: 'HTTP-VERB',
          query: {
            'query-name-1': 'query-value-1',
            'query-name-2': 'query-value-2',
          },
          path: 'PATH_INFO',
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            cookie: 'cookie-content',
            host: 'host-content',
          },
          cookies: {},
          body: null,
          param: 'value',
          existingHeader: 'Two-Header-Value',
        }),
        'utf8'
      )
    )
  })

  test('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({
      'Content-Disposition': 'attachment; filename="synthetic-filename.txt"',
      'One-Header-Name': 'One-Header-Value',
      'Set-Cookie': [
        'One-Cookie-Name=One-Cookie-Value',
        'Two-Cookie-Name=Two-Cookie-Value',
        'Two-Cookie-Name=',
      ],
      'Two-Header-Name': 'Two-Header-Value',
    })
    expect(expressRes.end).toBeCalledWith(
      Buffer.from(
        JSON.stringify({
          adapter: 'express',
          method: 'HTTP-VERB',
          query: {
            'query-name-1': 'query-value-1',
            'query-name-2': 'query-value-2',
          },
          path: 'PATH_INFO',
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            cookie: 'cookie-content',
            host: 'host-content',
          },
          cookies: {},
          body: null,
          param: 'value',
          existingHeader: 'Two-Header-Value',
        }),
        'utf8'
      )
    )
  })

  test('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(307)
    expect(expressRes.set).toBeCalledWith({
      Location: 'REDIRECT-PATH',
      'Set-Cookie': [],
    })
    expect(expressRes.end).toBeCalledWith('')
  })

  test('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(500)
    expect(expressRes.set).toBeCalledTimes(0)
    expect(expressRes.end).toBeCalledWith('')
  })

  test('should work with empty end', async () => {
    const wrappedHandler = wrapApiHandler(apiEmptyEndHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({ 'Set-Cookie': [] })
    expect(expressRes.end).toBeCalledWith(Buffer.from(''))
  })

  test('should work with empty end using chaining', async () => {
    const wrappedHandler = wrapApiHandler(
      apiEmptyEndChainingHandler,
      getCustomParams
    )
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(expressRes.status).toBeCalledWith(200)
    expect(expressRes.set).toBeCalledWith({ 'Set-Cookie': [] })
    expect(expressRes.end).toBeCalledWith(Buffer.from(''))
  })
})
