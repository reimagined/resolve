import {
  isRetryableServiceError,
  checkError,
} from '../../src/cloud/init-subscriber'

describe('Check error content', () => {
  test('Error fuzzy match by message', () => {
    const error = new Error('MyError')
    expect(checkError(error, 'MyError')).toBeTruthy()
  })
  test('Error fuzzy match by stack', () => {
    const error = new Error()
    error.stack = 'MyError'
    expect(checkError(error, 'MyError')).toBeTruthy()
  })
  test('Error strict match by name', () => {
    const error = new Error()
    error.code = 'MyError'
    expect(checkError(error, 'MyError')).toBeTruthy()
  })
  test('Error strict match by code', () => {
    const error = new Error()
    error.name = 'MyError'
    expect(checkError(error, 'MyError')).toBeTruthy()
  })
})

describe('Check is retryable service error', () => {
  test('TooManyRequestsException', () => {
    const error = new Error()
    error.code = 'TooManyRequestsException'
    expect(isRetryableServiceError(error)).toBeTruthy()
  })
  test('ServiceException', () => {
    const error = new Error()
    error.code = 'ServiceException'
    expect(isRetryableServiceError(error)).toBeTruthy()
  })
  test('CustomCode', () => {
    const error = new Error()
    error.code = 'CustomCode'
    expect(isRetryableServiceError(error)).toBeFalsy()
  })
})
