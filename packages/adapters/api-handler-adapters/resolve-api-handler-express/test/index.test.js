import escapeRegExp from 'lodash.escaperegexp'
import path from 'path'
import sinon from 'sinon'

import wrapApiHandler from '../src'

const stringifyAndNormalizePaths = value => {
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

  const monorepoDir = path.resolve(__dirname, '../../../../../')
  const relativeSource = source.replace(
    new RegExp(escapeRegExp(monorepoDir), 'gi'),
    '<MONOREPO_DIR>'
  )

  return relativeSource
    .replace(/at [^(]+? \([^)]+?\)/gi, '<STACK_FRAME>')
    .replace(/at <anonymous>/gi, '<STACK_FRAME>')
}

const extractInvocationInfo = sinonStub => {
  const result = { callCount: sinonStub.callCount, callsInfo: [] }
  for (let idx = 0; idx < sinonStub.callCount; idx++) {
    const { args, returnValue } = sinonStub.getCall(idx)
    result.callsInfo[idx] = {
      args: args.map(arg => stringifyAndNormalizePaths(arg)),
      returnValue: stringifyAndNormalizePaths(returnValue)
    }
  }
  return result
}

describe('API handler wrapper for express.js', () => {
  let expressReq, expressRes, httpBodyPromise, resolveHttpBody, getCustomParams

  beforeEach(() => {
    httpBodyPromise = new Promise(resolve => (resolveHttpBody = resolve))
    getCustomParams = sinon.stub().callsFake(() => ({ param: 'value' }))

    expressReq = Object.create(null, {
      on: {
        value: sinon.stub().callsFake((event, callback) => {
          if (event === 'data') {
            httpBodyPromise.then(
              bodyChunks =>
                Array.isArray(bodyChunks) ? bodyChunks.map(callback) : null,
              () => null
            )
          } else if (event === 'end') {
            httpBodyPromise.then(callback, callback)
          } else if (event === 'error') {
            httpBodyPromise.catch(callback)
          }
        }),
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
      set: sinon.stub().callsFake(() => expressRes),
      end: sinon.stub().callsFake(() => expressRes)
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

  const apiEmptyEndHandler = async (req, res) => {
    res.status(200)
    res.end()
  }

  const apiEmptyEndChainingHandler = async (req, res) => {
    res.status(200).end()
  }

  it('should work with primitive JSON handler with GET client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with primitive JSON handler with POST client request', async () => {
    const wrappedHandler = wrapApiHandler(apiJsonHandler, getCustomParams)
    resolveHttpBody([
      Buffer.from('Body partition one'),
      Buffer.from('Body partition two')
    ])
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with text handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiTextHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with custom handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiCustomHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with file handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiFileHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with redirect handler with any client request', async () => {
    const wrappedHandler = wrapApiHandler(apiRedirectHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with error throwing handler', async () => {
    const wrappedHandler = wrapApiHandler(apiThrowHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with empty end', async () => {
    const wrappedHandler = wrapApiHandler(apiEmptyEndHandler, getCustomParams)
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })

  it('should work with empty end using chaining', async () => {
    const wrappedHandler = wrapApiHandler(
      apiEmptyEndChainingHandler,
      getCustomParams
    )
    resolveHttpBody(null)
    await wrappedHandler(expressReq, expressRes)

    expect(extractInvocationInfo(expressReq.on)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.status)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.set)).toMatchSnapshot()

    expect(extractInvocationInfo(expressRes.end)).toMatchSnapshot()

    expect(extractInvocationInfo(getCustomParams)).toMatchSnapshot()
  })
})
