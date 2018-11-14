import { validateStaticPath } from '../src/validate_config'

describe('Regression test. method "validateStaticPath"', () => {
  test('should support absolute paths', () => {
    const config = { staticPath: 'http://resolve.dev' }

    validateStaticPath(config)

    expect(config.staticPath).toEqual('http://resolve.dev')
  })

  test('should support part of URL', () => {
    const config = { staticPath: 'static' }

    validateStaticPath(config)

    expect(config.staticPath).toEqual('static')
  })

  test('should not support empty URL', () => {
    const config = { staticPath: '' }

    expect(() => validateStaticPath(config)).toThrow()
  })

  test('should not support part of URL with leading slash', () => {
    const config = { staticPath: '/static' }

    expect(() => validateStaticPath(config)).toThrow()
  })

  test('should not support part of URL with trailing slash', () => {
    const config = { staticPath: 'static/' }

    expect(() => validateStaticPath(config)).toThrow()
  })
})
