import sinon from 'sinon'
import authenticateWrapper from '../src/authenticate_wrapper'

describe('method "fail"', () => {
  test('should works correctly with Error', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = new Error('test')
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('test')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with String', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = 'test'
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('test')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with Number', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = 42
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('42')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with Boolean (false)', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = false
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('false')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with Boolean (true)', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = true
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('true')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with undefined', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = undefined
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('Unknown error')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with null', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = null
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('Unknown error')
    expect(context.internalRes.statusCode).toEqual(401)
  })

  test('should works correctly with custom status', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = new Error('test')
    const status = 518

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('test')
    expect(context.internalRes.statusCode).toEqual(518)
  })

  test('should works correctly with custom Error', () => {
    const context = {
      jwtCookie: {
        name: 'jwt'
      },
      internalRes: {
        clearCookie: sinon.stub(),
        redirect: sinon.stub(),
        resolveAuth: sinon.stub()
      },
      originalOptions: {},
      resolveAuth: sinon.stub()
    }
    const error = new Error('test')
    error.status = 518
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('test')
    expect(context.internalRes.statusCode).toEqual(518)
  })
})
