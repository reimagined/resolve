import { validateRootPath } from '../src/validate_config'

describe('method "validateRootPath"', () => {
  test('should support part of URL', () => {
    const config = { rootPath: 'static' }

    validateRootPath(config)

    expect(config.rootPath).toEqual('static')
  })

  test('should support empty URL', () => {
    const config = { rootPath: '' }

    expect(config.rootPath).toEqual('')
  })

  test('should not support absolute paths', () => {
    const config = { rootPath: 'http://resolve.dev' }

    expect(() => validateRootPath(config)).toThrow()
  })

  test('should not support part of URL with leading slash', () => {
    const config = { rootPath: '/static' }

    expect(() => validateRootPath(config)).toThrow()
  })

  test('should not support part of URL with trailing slash', () => {
    const config = { rootPath: 'static/' }

    expect(() => validateRootPath(config)).toThrow()
  })
})
