/* eslint-disable no-console */
import { isRetryableEventSourceMappingError } from '../../src/cloud/init-subscriber'

describe('Check is retryable event source mapping error', () => {
  test('AWS.SimpleQueueService.QueueDeletedRecently without Ensure mode', () => {
    const error = new Error()
    error.code = 'AWS.SimpleQueueService.QueueDeletedRecently'
    expect(isRetryableEventSourceMappingError(error, false)).toBeFalsy()
  })
  test('QueueDeletedRecently without Ensure mode', () => {
    const error = new Error()
    error.code = 'QueueDeletedRecently'
    expect(isRetryableEventSourceMappingError(error, false)).toBeFalsy()
  })
  test('QueueAlreadyExists without Ensure mode', () => {
    const error = new Error()
    error.code = 'QueueAlreadyExists'
    expect(isRetryableEventSourceMappingError(error, false)).toBeTruthy()
  })
  test('ResourceInUseException without Ensure mode', () => {
    const error = new Error()
    error.code = 'ResourceInUseException'
    expect(isRetryableEventSourceMappingError(error, false)).toBeTruthy()
  })
  test('TooManyRequestsException without Ensure mode', () => {
    const error = new Error()
    error.code = 'TooManyRequestsException'
    expect(isRetryableEventSourceMappingError(error, false)).toBeTruthy()
  })
  test('ServiceException without Ensure mode', () => {
    const error = new Error()
    error.code = 'ServiceException'
    expect(isRetryableEventSourceMappingError(error, false)).toBeTruthy()
  })
  test('CustomCode without Ensure mode', () => {
    const error = new Error()
    error.code = 'CustomCode'
    expect(isRetryableEventSourceMappingError(error, false)).toBeFalsy()
  })

  test('AWS.SimpleQueueService.QueueDeletedRecently with Ensure mode', () => {
    const error = new Error()
    error.code = 'AWS.SimpleQueueService.QueueDeletedRecently'
    expect(isRetryableEventSourceMappingError(error, true)).toBeTruthy()
  })
  test('QueueDeletedRecently with Ensure mode', () => {
    const error = new Error()
    error.code = 'QueueDeletedRecently'
    expect(isRetryableEventSourceMappingError(error, true)).toBeTruthy()
  })
  test('QueueAlreadyExists with Ensure mode', () => {
    const error = new Error()
    error.code = 'QueueAlreadyExists'
    expect(isRetryableEventSourceMappingError(error, true)).toBeFalsy()
  })
  test('ResourceInUseException with Ensure mode', () => {
    const error = new Error()
    error.code = 'ResourceInUseException'
    expect(isRetryableEventSourceMappingError(error, true)).toBeTruthy()
  })
  test('TooManyRequestsException with Ensure mode', () => {
    const error = new Error()
    error.code = 'TooManyRequestsException'
    expect(isRetryableEventSourceMappingError(error, true)).toBeTruthy()
  })
  test('ServiceException with Ensure mode', () => {
    const error = new Error()
    error.code = 'ServiceException'
    expect(isRetryableEventSourceMappingError(error, true)).toBeTruthy()
  })
  test('CustomCode with Ensure mode', () => {
    const error = new Error()
    error.code = 'CustomCode'
    expect(isRetryableEventSourceMappingError(error, true)).toBeFalsy()
  })
})
