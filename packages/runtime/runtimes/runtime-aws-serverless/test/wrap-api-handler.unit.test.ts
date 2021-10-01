import escapeRegExp from 'lodash.escaperegexp'
import path from 'path'

import { wrapApiHandler } from '../src/wrap-api-handler'
import { ResolveRequest, ResolveResponse } from '@resolve-js/core'

const stringifyAndNormalizePaths = (value: any) => {
  const source = (() => {
    switch (typeof value) {
      case 'function':
        return '[FUNCTION IMPLEMENTATION]'
      case 'undefined':
        return 'undefined'
      default:
        return JSON.stringify(value)
    }
  })()

  const monorepoDir = path.resolve(__dirname, '../../../../')
  const relativeSource = source.replace(
    new RegExp(escapeRegExp(monorepoDir), 'gi'),
    '<MONOREPO_DIR>'
  )

  return relativeSource
    .replace(/at [^(]+? \([^)]+?\)/gi, '<STACK_FRAME>')
    .replace(/at <anonymous>/gi, '<STACK_FRAME>')
}

const extractInvocationInfo = (fn: jest.Mock) => {
  const result: {
    callCount: number
    callsInfo: any[]
  } = { callCount: fn.mock.calls.length, callsInfo: [] }
  for (let idx = 0; idx < fn.mock.calls.length; idx++) {
    const args = fn.mock.calls[idx]
    const returnValue = fn.mock.results[idx]
    result.callsInfo[idx] = {
      args: args.map((arg: any) => stringifyAndNormalizePaths(arg)),
      returnValue: stringifyAndNormalizePaths(returnValue),
    }
  }
  return result
}

describe('API handler wrapper for AWS Lambda', () => {
  let lambdaEvent: any
  let lambdaContext: any
  let lambdaCallback: any
  let getCustomParams: any

  beforeEach(() => {
    getCustomParams = jest.fn(() => ({ param: 'value' }))

    lambdaEvent = Object.create(null, {
      headers: {
        value: {
          'header-name-1': 'header-value-1',
          'header-name-2': 'header-value-2',
          cookie: 'cookie-content',
          host: 'host-content',
        },
        enumerable: true,
      },
      path: {
        value: 'PATH_INFO',
        enumerable: true,
      },
      body: {
        value: 'BODY_CONTENT',
        enumerable: true,
      },
      multiValueQueryStringParameters: {
        value: {
          'query-name-1': 'query-value-1',
          'query-name-2': 'query-value-2',
        },
        enumerable: true,
      },
      httpMethod: {
        value: 'GET',
        enumerable: true,
      },
    })
    lambdaContext = null
    lambdaCallback = jest.fn()
  })

  afterEach(() => {
    getCustomParams = null
    lambdaEvent = null
    lambdaContext = null
    lambdaCallback = null
  })

  const apiJsonHandler = async (req: ResolveRequest, res: ResolveResponse) => {
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

  const apiTextHandler = async (req: ResolveRequest, res: ResolveResponse) => {
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

  const apiCustomHandler = async (
    req: ResolveRequest,
    res: ResolveResponse
  ) => {
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

  const apiFileHandler = async (req: ResolveRequest, res: ResolveResponse) => {
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

  const apiRedirectHandler = async (
    req: ResolveRequest,
    res: ResolveResponse
  ) => {
    res.redirect('REDIRECT-PATH', 307)
    res.redirect('REDIRECT-PATH')
    res.status(307)
    res.text('Result text')
    res.status(307)
  }

  const apiThrowHandler = async () => {
    throw new Error('Custom error')
  }

  const apiEmptyEndHandler = async (
    req: ResolveRequest,
    res: ResolveResponse
  ) => {
    res.status(200)
    res.end()
  }

  const apiEmptyEndChainingHandler = async (
    req: ResolveRequest,
    res: ResolveResponse
  ) => {
    res.status(200).end()
  }

  const apiReturnRequestHandler = async (
    req: ResolveRequest,
    res: ResolveResponse
  ) => {
    res.json(req)
  }

  it('should work with primitive JSON handler with GET client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with empty end', async () => {
    const wrappedHandler = wrapApiHandler(apiEmptyEndHandler, getCustomParams)
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with empty end using chaining', async () => {
    const wrappedHandler = wrapApiHandler(
      apiEmptyEndChainingHandler,
      getCustomParams
    )
    await wrappedHandler(lambdaEvent, lambdaContext, lambdaCallback)

    expect(extractInvocationInfo(lambdaCallback)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should correctly parsing query with array params', async () => {
    const wrappedHandler = wrapApiHandler(
      apiReturnRequestHandler,
      getCustomParams
    )
    const customEvent = {
      ...lambdaEvent,
      multiValueQueryStringParameters: {
        'a[]': ['1', '2'],
        b: ['1', '2'],
        c: ['[1,2]'],
        d: ['1,2'],
        'e[]': ['1,2'],
        'f[]': ['1'],
      },
    }
    const { body } = await wrappedHandler(customEvent, lambdaContext)
    const query = JSON.parse(body).query

    expect(query).toEqual({
      a: ['1', '2'],
      b: ['1', '2'],
      c: '[1,2]',
      d: '1,2',
      e: ['1,2'],
      f: ['1'],
    })
  })

  it('should correctly parsing "param=1&param=2&param=3" query from lambda edge', async () => {
    const wrappedHandler = wrapApiHandler(
      apiReturnRequestHandler,
      getCustomParams
    )
    const customEvent = {
      ...lambdaEvent,
      headers: [],
      querystring: 'param=1&param=2&param=3',
    }
    const { body } = await wrappedHandler(customEvent, lambdaContext)
    const query = JSON.parse(Buffer.from(body, 'base64').toString()).query

    expect(query).toEqual({ param: ['1', '2', '3'] })
  })

  it('should correctly parsing "param[]=1&param[]=2&param[]=3" query from lambda edge', async () => {
    const wrappedHandler = wrapApiHandler(
      apiReturnRequestHandler,
      getCustomParams
    )
    const customEvent = {
      ...lambdaEvent,
      headers: [],
      querystring: 'param[]=1&param[]=2&param[]=3',
    }
    const { body } = await wrappedHandler(customEvent, lambdaContext)
    const query = JSON.parse(Buffer.from(body, 'base64').toString()).query

    expect(query).toEqual({ param: ['1', '2', '3'] })
  })

  it('should correctly parsing "param[0]=1&param[1]=2&param[2]=3" query from lambda edge', async () => {
    const wrappedHandler = wrapApiHandler(
      apiReturnRequestHandler,
      getCustomParams
    )
    const customEvent = {
      ...lambdaEvent,
      headers: [],
      querystring: 'param[0]=1&param[1]=2&param[2]=3',
    }
    const { body } = await wrappedHandler(customEvent, lambdaContext)
    const query = JSON.parse(Buffer.from(body, 'base64').toString()).query

    expect(query).toEqual({ param: ['1', '2', '3'] })
  })
})
