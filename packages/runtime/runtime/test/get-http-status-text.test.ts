import { getReasonPhrase } from 'http-status-codes'

import getHttpStatusText from '../src/common/utils/get-http-status-text'

describe('method "getHttpStatusText"', () => {
  test('should return "OK" when status = 200', () => {
    expect(getHttpStatusText(200)).toEqual(getReasonPhrase(200))
  })

  test('should return "Bad Gateway" when status = 400', () => {
    expect(getHttpStatusText(400)).toEqual(getReasonPhrase(400))
  })

  test('should return "Not Found" when status = 404', () => {
    expect(getHttpStatusText(404)).toEqual(getReasonPhrase(404))
  })

  test('should return "Internal Server Error" when status = 500', () => {
    expect(getHttpStatusText(500)).toEqual(getReasonPhrase(500))
  })

  test('should return "Bad Gateway" when status = 502', () => {
    expect(getHttpStatusText(502)).toEqual(getReasonPhrase(502))
  })

  test('should return "" when unknown error', () => {
    expect(getHttpStatusText(477)).toEqual('')
  })
})
