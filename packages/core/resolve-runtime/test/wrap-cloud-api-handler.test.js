import wrapApiHandler from '../src/cloud/wrap-api-handler'

describe('API handler wrapper for AWS Lambda', () => {
  let lambdaEvent, lambdaContext, getCustomParams

  beforeEach(() => {
    getCustomParams = () => ({ param: 'value' })

    lambdaEvent = Object.create(null, {
      headers: {
        value: [
          { key: 'header-name-1', value: 'header-value-1' },
          { key: 'header-name-2', value: 'header-value-2' },
          { key: 'cookie', value: 'cookie-content' },
          { key: 'host', value: 'host-content' },
        ],
        enumerable: true,
      },
      uri: {
        value: 'uri/uri/uri',
        enumerable: true,
      },
      body: {
        value: Buffer.from('BODY_CONTENT', 'utf8').toString('base64'),
        enumerable: true,
      },
      querystring: {
        value: 'a=b&c=d&e=f',
        enumerable: true,
      },
      httpMethod: {
        value: 'GET',
        enumerable: true,
      },
    })

    lambdaContext = {
      runtime: 10,
    }
  })

  afterEach(() => {
    getCustomParams = null
    lambdaEvent = null
    lambdaContext = null
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

  const apiReturnRequestHandler = async (req, res) => {
    res.json(req)
  }

  test('should work with primitive JSON handler with GET client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: Buffer.from(
        JSON.stringify({
          context: {
            runtime: 10,
          },
          method: 'GET',
          path: 'uri/uri/uri',
          query: { a: 'b', c: 'd', e: 'f' },
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            host: 'host-content',
          },
          cookies: {},
          body: 'BODY_CONTENT',
          param: 'value',
          existingHeader: 'Two-Header-Value',
          missingHeader: null,
        }),
        'utf8'
      ).toString('base64'),
      headers: [
        {
          key: 'One-Header-Name',
          value: 'One-Header-Value',
        },
        {
          key: 'Two-Header-Name',
          value: 'Two-Header-Value',
        },
        {
          key: 'Content-Type',
          value: 'application/json',
        },
        {
          key: 'Set-cookie',
          value: 'One-Cookie-Name=One-Cookie-Value',
        },
        {
          key: 'set-cookie',
          value: 'Two-Cookie-Name=Two-Cookie-Value',
        },
        {
          key: 'SEt-cookie',
          value: 'Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      ],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: Buffer.from(
        JSON.stringify({
          context: { runtime: 10 },
          method: 'GET',
          path: 'uri/uri/uri',
          query: { a: 'b', c: 'd', e: 'f' },
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            host: 'host-content',
          },
          cookies: {},
          body: 'BODY_CONTENT',
          param: 'value',
          existingHeader: 'Two-Header-Value',
          missingHeader: null,
        }),
        'utf8'
      ).toString('base64'),
      headers: [
        {
          key: 'One-Header-Name',
          value: 'One-Header-Value',
        },
        {
          key: 'Two-Header-Name',
          value: 'Two-Header-Value',
        },
        {
          key: 'Content-Type',
          value: 'application/json',
        },
        {
          key: 'Set-cookie',
          value: 'One-Cookie-Name=One-Cookie-Value',
        },
        {
          key: 'set-cookie',
          value: 'Two-Cookie-Name=Two-Cookie-Value',
        },
        {
          key: 'SEt-cookie',
          value: 'Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      ],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: Buffer.from(
        JSON.stringify({
          context: { runtime: 10 },
          method: 'GET',
          path: 'uri/uri/uri',
          query: { a: 'b', c: 'd', e: 'f' },
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            host: 'host-content',
          },
          cookies: {},
          body: 'BODY_CONTENT',
          param: 'value',
          existingHeader: 'Two-Header-Value',
          missingHeader: null,
        }),
        'utf8'
      ).toString('base64'),
      headers: [
        {
          key: 'One-Header-Name',
          value: 'One-Header-Value',
        },
        {
          key: 'Two-Header-Name',
          value: 'Two-Header-Value',
        },
        {
          key: 'Set-cookie',
          value: 'One-Cookie-Name=One-Cookie-Value',
        },
        {
          key: 'set-cookie',
          value: 'Two-Cookie-Name=Two-Cookie-Value',
        },
        {
          key: 'SEt-cookie',
          value: 'Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      ],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: Buffer.from(
        JSON.stringify({
          context: { runtime: 10 },
          method: 'GET',
          path: 'uri/uri/uri',
          query: { a: 'b', c: 'd', e: 'f' },
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            host: 'host-content',
          },
          cookies: {},
          body: 'BODY_CONTENT',
          param: 'value',
          existingHeader: 'Two-Header-Value',
          missingHeader: null,
        }),
        'utf8'
      ).toString('base64'),
      headers: [
        {
          key: 'One-Header-Name',
          value: 'One-Header-Value',
        },
        {
          key: 'Two-Header-Name',
          value: 'Two-Header-Value',
        },
        {
          key: 'Set-cookie',
          value: 'One-Cookie-Name=One-Cookie-Value',
        },
        {
          key: 'set-cookie',
          value: 'Two-Cookie-Name=Two-Cookie-Value',
        },
        {
          key: 'SEt-cookie',
          value: 'Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      ],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: Buffer.from(
        JSON.stringify({
          context: { runtime: 10 },
          method: 'GET',
          path: 'uri/uri/uri',
          query: { a: 'b', c: 'd', e: 'f' },
          headers: {
            'header-name-1': 'header-value-1',
            'header-name-2': 'header-value-2',
            host: 'host-content',
          },
          cookies: {},
          body: 'BODY_CONTENT',
          param: 'value',
          existingHeader: 'Two-Header-Value',
          missingHeader: null,
        }),
        'utf8'
      ).toString('base64'),
      headers: [
        {
          key: 'One-Header-Name',
          value: 'One-Header-Value',
        },
        {
          key: 'Two-Header-Name',
          value: 'Two-Header-Value',
        },
        {
          key: 'Content-Disposition',
          value: 'attachment; filename="synthetic-filename.txt"',
        },
        {
          key: 'Set-cookie',
          value: 'One-Cookie-Name=One-Cookie-Value',
        },
        {
          key: 'set-cookie',
          value: 'Two-Cookie-Name=Two-Cookie-Value',
        },
        {
          key: 'SEt-cookie',
          value: 'Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      ],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: '',
      headers: [
        {
          key: 'Location',
          value: 'REDIRECT-PATH',
        },
      ],
      httpStatus: 307,
      httpStatusText: 'Temporary Redirect',
    })
  })

  test('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: '',
      headers: [],
      httpStatus: 500,
      httpStatusText: 'Internal Server Error',
    })
  })

  test('should work with empty end', async () => {
    const wrappedHandler = wrapApiHandler(apiEmptyEndHandler, getCustomParams)
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: '',
      headers: [],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should work with empty end using chaining', async () => {
    const wrappedHandler = wrapApiHandler(
      apiEmptyEndChainingHandler,
      getCustomParams
    )
    const result = await wrappedHandler(lambdaEvent, lambdaContext)
    expect(result).toEqual({
      body: '',
      headers: [],
      httpStatus: 200,
      httpStatusText: 'OK',
    })
  })

  test('should correctly parsing query with array params', async () => {
    const wrappedHandler = wrapApiHandler(
      apiReturnRequestHandler,
      getCustomParams
    )
    const customEvent = {
      ...lambdaEvent,
      querystring: 'a[]=1&a[]=2&b=1&b=2&c=[1,2]&d=1,2&e[]=[1,2]&f[]=1',
    }
    const result = await wrappedHandler(customEvent, lambdaContext)
    const query = JSON.parse(
      Buffer.from(result.body, 'base64').toString('utf8')
    ).query

    expect(query).toEqual({
      a: ['1', '2'],
      b: '2',
      c: '[1,2]',
      d: '1,2',
      e: ['[1,2]'],
      f: ['1'],
    })
  })
})
