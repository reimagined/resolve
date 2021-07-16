import getHttpStatusText from '../src/common/utils/get-http-status-text'

describe('method "getHttpStatusText"', () => {
  test('should return 500 when code = undefined', () => {
    expect(getHttpStatusText(200)).toEqual('OK')
  })

  test('should return "Bad Gateway" when status = 502', () => {
    expect(getHttpStatusText(400)).toEqual('Bad Request')
  })

  test('should return "Not Found" when status = 502', () => {
    expect(getHttpStatusText(404)).toEqual('Not Found')
  })

  test('should return "Internal Server Error" when status = 502', () => {
    expect(getHttpStatusText(500)).toEqual('Internal Server Error')
  })

  test('should return "Bad Gateway" when status = 502', () => {
    expect(getHttpStatusText(502)).toEqual('Bad Gateway')
  })

  test('should return "" when unknown error', () => {
    expect(getHttpStatusText(477)).toEqual('')
  })
})
