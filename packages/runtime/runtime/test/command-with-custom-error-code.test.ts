import extractErrorHttpCode from '../src/common/utils/extract-error-http-code'

describe('method "extractErrorHttpCode"', () => {
  test('should return 500 when code = undefined', () => {
    const error = new Error('UnknownError')
    expect(extractErrorHttpCode(error)).toEqual(500)
  })

  test('should return 404 when code = 404', () => {
    const error: Error & { code?: number } = new Error('NotError')
    error.code = 404
    expect(extractErrorHttpCode(error)).toEqual(404)
  })
})
