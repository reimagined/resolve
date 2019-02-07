import wrapAuthRequest from '../src/wrap_auth_request'

describe('method "wrapAuthRequest"', () => {
  test('should not parse the body { body: null }', () => {
    const req = {
      body: null,
      headers: {}
    }

    wrapAuthRequest(req)

    expect(req.body).toEqual(null)
  })

  test('should not parse the body { body: undefined }', () => {
    const rawReq = { headers: {} }

    const req = wrapAuthRequest(rawReq)

    expect(req.body).toEqual(undefined)
  })

  test('should not parse the body { content-type: undefined }', () => {
    const rawReq = { body: 'something', headers: {} }

    const req = wrapAuthRequest(rawReq)

    expect(req.body).toEqual('something')
  })

  test('should parse the body as "application/x-www-form-urlencoded"', () => {
    const rawReq = {
      body: 'a=5&b=10',
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    }

    const req = wrapAuthRequest(rawReq)

    expect(req.body).toEqual({
      a: '5',
      b: '10'
    })
  })

  test('should parse the body as "application/json"', () => {
    const rawReq = {
      body: JSON.stringify({ a: 5, b: 10 }),
      headers: { 'content-type': 'application/json' }
    }

    const req = wrapAuthRequest(rawReq)

    expect(req.body).toEqual({
      a: 5,
      b: 10
    })
  })

  test('should throw error', () => {
    const rawReq = {
      body: '0101010101010',
      headers: { 'content-type': 'unknown' }
    }

    try {
      wrapAuthRequest(rawReq)
      return Promise.reject('Test failed')
    } catch (error) {
      expect(error.message).toEqual(
        `Invalid request body Content-type: unknown`
      )
    }
  })
})
