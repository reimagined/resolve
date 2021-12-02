import authenticateWrapper from '../src/authenticate_wrapper'

describe('method "fail"', () => {
  /* eslint-disable no-console */
  const consoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = consoleError.bind(console)
  })
  /* eslint-enable no-console */

  test('should works correctly with Error', () => {
    const context = {
      jwtCookie: {
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
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
        name: 'jwt',
      },
      internalRes: {
        clearCookie: jest.fn(),
        redirect: jest.fn(),
        resolveAuth: jest.fn(),
      },
      originalOptions: {},
      resolveAuth: jest.fn(),
    }
    const error = new Error('test')
    error.status = 518
    const status = undefined

    authenticateWrapper.fail.call(context, error, status)

    expect(context.internalRes.error).toEqual('test')
    expect(context.internalRes.statusCode).toEqual(518)
  })
})
