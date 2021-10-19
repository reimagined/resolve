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

describe('API handler wrapper for express.js', () => {
  let expressReq: any
  let expressRes: any
  let httpBodyPromise: any
  let resolveHttpBody: any
  let getCustomParams: any

  beforeEach(() => {
    httpBodyPromise = new Promise((resolve) => (resolveHttpBody = resolve))
    getCustomParams = jest.fn(() => ({ param: 'value' }))

    expressReq = Object.create(null, {
      on: {
        value: jest.fn((event, callback) => {
          if (event === 'data') {
            httpBodyPromise.then(
              (bodyChunks: any[]) =>
                Array.isArray(bodyChunks) ? bodyChunks.map(callback) : null,
              () => null
            )
          } else if (event === 'end') {
            httpBodyPromise.then(callback, callback)
          } else if (event === 'error') {
            httpBodyPromise.catch(callback)
          }
        }),
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
      status: jest.fn(() => expressRes),
      set: jest.fn(() => expressRes),
      end: jest.fn(() => expressRes),
    }
  })

  afterEach(() => {
    getCustomParams = null
    httpBodyPromise = null
    resolveHttpBody = null
    expressReq = null
    expressRes = null
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

  it('should work with primitive JSON handler with GET client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"One-Header-Name\\":\\"One-Header-Value\\",\\"Two-Header-Name\\":\\"Two-Header-Value\\",\\"Content-Type\\":\\"application/json\\",\\"Set-Cookie\\":[\\"One-Cookie-Name=One-Cookie-Value\\",\\"Two-Cookie-Name=Two-Cookie-Value\\",\\"Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT\\"]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "\\"{\\\\\\"adapter\\\\\\":\\\\\\"express\\\\\\",\\\\\\"method\\\\\\":\\\\\\"HTTP-VERB\\\\\\",\\\\\\"query\\\\\\":{\\\\\\"query-name-1\\\\\\":\\\\\\"query-value-1\\\\\\",\\\\\\"query-name-2\\\\\\":\\\\\\"query-value-2\\\\\\"},\\\\\\"path\\\\\\":\\\\\\"PATH_INFO\\\\\\",\\\\\\"headers\\\\\\":{\\\\\\"header-name-1\\\\\\":\\\\\\"header-value-1\\\\\\",\\\\\\"header-name-2\\\\\\":\\\\\\"header-value-2\\\\\\",\\\\\\"cookie\\\\\\":\\\\\\"cookie-content\\\\\\",\\\\\\"host\\\\\\":\\\\\\"host-content\\\\\\"},\\\\\\"cookies\\\\\\":{},\\\\\\"body\\\\\\":null,\\\\\\"param\\\\\\":\\\\\\"value\\\\\\",\\\\\\"existingHeader\\\\\\":\\\\\\"Two-Header-Value\\\\\\"}\\"",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveHttpBody([
      Buffer.from('Body partition one'),
      Buffer.from('Body partition two'),
    ])
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"One-Header-Name\\":\\"One-Header-Value\\",\\"Two-Header-Name\\":\\"Two-Header-Value\\",\\"Content-Type\\":\\"application/json\\",\\"Set-Cookie\\":[\\"One-Cookie-Name=One-Cookie-Value\\",\\"Two-Cookie-Name=Two-Cookie-Value\\",\\"Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT\\"]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "\\"{\\\\\\"adapter\\\\\\":\\\\\\"express\\\\\\",\\\\\\"method\\\\\\":\\\\\\"HTTP-VERB\\\\\\",\\\\\\"query\\\\\\":{\\\\\\"query-name-1\\\\\\":\\\\\\"query-value-1\\\\\\",\\\\\\"query-name-2\\\\\\":\\\\\\"query-value-2\\\\\\"},\\\\\\"path\\\\\\":\\\\\\"PATH_INFO\\\\\\",\\\\\\"headers\\\\\\":{\\\\\\"header-name-1\\\\\\":\\\\\\"header-value-1\\\\\\",\\\\\\"header-name-2\\\\\\":\\\\\\"header-value-2\\\\\\",\\\\\\"cookie\\\\\\":\\\\\\"cookie-content\\\\\\",\\\\\\"host\\\\\\":\\\\\\"host-content\\\\\\"},\\\\\\"cookies\\\\\\":{},\\\\\\"body\\\\\\":null,\\\\\\"param\\\\\\":\\\\\\"value\\\\\\",\\\\\\"existingHeader\\\\\\":\\\\\\"Two-Header-Value\\\\\\"}\\"",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"One-Header-Name\\":\\"One-Header-Value\\",\\"Two-Header-Name\\":\\"Two-Header-Value\\",\\"Set-Cookie\\":[\\"One-Cookie-Name=One-Cookie-Value\\",\\"Two-Cookie-Name=Two-Cookie-Value\\",\\"Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT\\"]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"type\\":\\"Buffer\\",\\"data\\":[123,34,97,100,97,112,116,101,114,34,58,34,101,120,112,114,101,115,115,34,44,34,109,101,116,104,111,100,34,58,34,72,84,84,80,45,86,69,82,66,34,44,34,113,117,101,114,121,34,58,123,34,113,117,101,114,121,45,110,97,109,101,45,49,34,58,34,113,117,101,114,121,45,118,97,108,117,101,45,49,34,44,34,113,117,101,114,121,45,110,97,109,101,45,50,34,58,34,113,117,101,114,121,45,118,97,108,117,101,45,50,34,125,44,34,112,97,116,104,34,58,34,80,65,84,72,95,73,78,70,79,34,44,34,104,101,97,100,101,114,115,34,58,123,34,104,101,97,100,101,114,45,110,97,109,101,45,49,34,58,34,104,101,97,100,101,114,45,118,97,108,117,101,45,49,34,44,34,104,101,97,100,101,114,45,110,97,109,101,45,50,34,58,34,104,101,97,100,101,114,45,118,97,108,117,101,45,50,34,44,34,99,111,111,107,105,101,34,58,34,99,111,111,107,105,101,45,99,111,110,116,101,110,116,34,44,34,104,111,115,116,34,58,34,104,111,115,116,45,99,111,110,116,101,110,116,34,125,44,34,99,111,111,107,105,101,115,34,58,123,125,44,34,98,111,100,121,34,58,110,117,108,108,44,34,112,97,114,97,109,34,58,34,118,97,108,117,101,34,44,34,101,120,105,115,116,105,110,103,72,101,97,100,101,114,34,58,34,84,119,111,45,72,101,97,100,101,114,45,86,97,108,117,101,34,125]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"One-Header-Name\\":\\"One-Header-Value\\",\\"Two-Header-Name\\":\\"Two-Header-Value\\",\\"Set-Cookie\\":[\\"One-Cookie-Name=One-Cookie-Value\\",\\"Two-Cookie-Name=Two-Cookie-Value\\",\\"Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT\\"]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"type\\":\\"Buffer\\",\\"data\\":[123,34,97,100,97,112,116,101,114,34,58,34,101,120,112,114,101,115,115,34,44,34,109,101,116,104,111,100,34,58,34,72,84,84,80,45,86,69,82,66,34,44,34,113,117,101,114,121,34,58,123,34,113,117,101,114,121,45,110,97,109,101,45,49,34,58,34,113,117,101,114,121,45,118,97,108,117,101,45,49,34,44,34,113,117,101,114,121,45,110,97,109,101,45,50,34,58,34,113,117,101,114,121,45,118,97,108,117,101,45,50,34,125,44,34,112,97,116,104,34,58,34,80,65,84,72,95,73,78,70,79,34,44,34,104,101,97,100,101,114,115,34,58,123,34,104,101,97,100,101,114,45,110,97,109,101,45,49,34,58,34,104,101,97,100,101,114,45,118,97,108,117,101,45,49,34,44,34,104,101,97,100,101,114,45,110,97,109,101,45,50,34,58,34,104,101,97,100,101,114,45,118,97,108,117,101,45,50,34,44,34,99,111,111,107,105,101,34,58,34,99,111,111,107,105,101,45,99,111,110,116,101,110,116,34,44,34,104,111,115,116,34,58,34,104,111,115,116,45,99,111,110,116,101,110,116,34,125,44,34,99,111,111,107,105,101,115,34,58,123,125,44,34,98,111,100,121,34,58,110,117,108,108,44,34,112,97,114,97,109,34,58,34,118,97,108,117,101,34,44,34,101,120,105,115,116,105,110,103,72,101,97,100,101,114,34,58,34,84,119,111,45,72,101,97,100,101,114,45,86,97,108,117,101,34,125]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"One-Header-Name\\":\\"One-Header-Value\\",\\"Two-Header-Name\\":\\"Two-Header-Value\\",\\"Content-Disposition\\":\\"attachment; filename=\\\\\\"synthetic-filename.txt\\\\\\"\\",\\"Set-Cookie\\":[\\"One-Cookie-Name=One-Cookie-Value\\",\\"Two-Cookie-Name=Two-Cookie-Value\\",\\"Two-Cookie-Name=; Expires=Thu, 01 Jan 1970 00:00:00 GMT\\"]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"type\\":\\"Buffer\\",\\"data\\":[123,34,97,100,97,112,116,101,114,34,58,34,101,120,112,114,101,115,115,34,44,34,109,101,116,104,111,100,34,58,34,72,84,84,80,45,86,69,82,66,34,44,34,113,117,101,114,121,34,58,123,34,113,117,101,114,121,45,110,97,109,101,45,49,34,58,34,113,117,101,114,121,45,118,97,108,117,101,45,49,34,44,34,113,117,101,114,121,45,110,97,109,101,45,50,34,58,34,113,117,101,114,121,45,118,97,108,117,101,45,50,34,125,44,34,112,97,116,104,34,58,34,80,65,84,72,95,73,78,70,79,34,44,34,104,101,97,100,101,114,115,34,58,123,34,104,101,97,100,101,114,45,110,97,109,101,45,49,34,58,34,104,101,97,100,101,114,45,118,97,108,117,101,45,49,34,44,34,104,101,97,100,101,114,45,110,97,109,101,45,50,34,58,34,104,101,97,100,101,114,45,118,97,108,117,101,45,50,34,44,34,99,111,111,107,105,101,34,58,34,99,111,111,107,105,101,45,99,111,110,116,101,110,116,34,44,34,104,111,115,116,34,58,34,104,111,115,116,45,99,111,110,116,101,110,116,34,125,44,34,99,111,111,107,105,101,115,34,58,123,125,44,34,98,111,100,121,34,58,110,117,108,108,44,34,112,97,114,97,109,34,58,34,118,97,108,117,101,34,44,34,101,120,105,115,116,105,110,103,72,101,97,100,101,114,34,58,34,84,119,111,45,72,101,97,100,101,114,45,86,97,108,117,101,34,125]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "500",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "\\"\\"",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "500",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "\\"\\"",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with empty end', async () => {
    const wrappedHandler = wrapApiHandler(apiEmptyEndHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"Set-Cookie\\":[]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"type\\":\\"Buffer\\",\\"data\\":[]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })

  it('should work with empty end using chaining', async () => {
    const wrappedHandler = wrapApiHandler(
      apiEmptyEndChainingHandler,
      getCustomParams
    )
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchInlineSnapshot(`
Object {
  "callCount": 0,
  "callsInfo": Array [],
}
`)

    expect(extractInvocationInfo(expressRes.status)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "200",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.set)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"Set-Cookie\\":[]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(expressRes.end)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"type\\":\\"Buffer\\",\\"data\\":[]}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{}}",
    },
  ],
}
`)

    expect(extractInvocationInfo(getCustomParams)).toMatchInlineSnapshot(`
Object {
  "callCount": 1,
  "callsInfo": Array [
    Object {
      "args": Array [
        "{\\"method\\":\\"HTTP-VERB\\",\\"query\\":{\\"query-name-1\\":\\"query-value-1\\",\\"query-name-2\\":\\"query-value-2\\"},\\"path\\":\\"PATH_INFO\\",\\"headers\\":{\\"header-name-1\\":\\"header-value-1\\",\\"header-name-2\\":\\"header-value-2\\",\\"cookie\\":\\"cookie-content\\",\\"host\\":\\"host-content\\"}}",
        "{}",
      ],
      "returnValue": "{\\"type\\":\\"return\\",\\"value\\":{\\"param\\":\\"value\\"}}",
    },
  ],
}
`)
  })
})
