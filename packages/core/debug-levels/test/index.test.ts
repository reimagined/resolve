import createLogger, { debugLevels, Debug } from '../src/index'

test('should work with provided DEBUG and DEBUG_LEVEL envs', () => {
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  const envProvider = {
    DEBUG: 'namespace',
    DEBUG_LEVEL: 'warn',
  }
  const namespace = 'namespace'
  const logger = debugLevels(
    (debugProvider as unknown) as Debug,
    envProvider,
    namespace
  )

  logger.log('Log message')
  logger.error('Error message')
  logger.warn('Warn message')
  logger.debug('Debug message')
  logger.info('Info message')
  logger.verbose('Verbose message')

  expect(debugProvider).toBeCalledWith('namespace')

  expect(debugPrinter).toBeCalledWith('Log message')
  expect(debugPrinter).toBeCalledWith('Error message')
  expect(debugPrinter).toBeCalledWith('Warn message')
  expect(debugPrinter).not.toBeCalledWith('Debug message')
  expect(debugPrinter).not.toBeCalledWith('Info message')
  expect(debugPrinter).not.toBeCalledWith('Verbose message')
})

test('should set DEBUG_LEVEL="debug" if DEBUG_LEVEL env is not set', () => {
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  const envProvider = {
    DEBUG: 'namespace',
  }
  const namespace = 'namespace'
  const logger = debugLevels(
    (debugProvider as any) as Debug,
    envProvider,
    namespace
  )

  logger.log('Log message')
  logger.error('Error message')
  logger.warn('Warn message')
  logger.debug('Debug message')
  logger.info('Info message')
  logger.verbose('Verbose message')

  expect(debugProvider).toBeCalledWith('namespace')

  expect(debugPrinter).toBeCalledWith('Log message')
  expect(debugPrinter).toBeCalledWith('Error message')
  expect(debugPrinter).toBeCalledWith('Warn message')
  expect(debugPrinter).toBeCalledWith('Debug message')
  expect(debugPrinter).not.toBeCalledWith('Info message')
  expect(debugPrinter).not.toBeCalledWith('Verbose message')
})

test('should set DEBUG="resolve:*" and DEBUG_LEVEL="warn" if DEBUG env is not set', () => {
  const debugNamespaceEnabler = jest.fn()
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  Object.defineProperty(debugProvider, 'enable', {
    value: debugNamespaceEnabler,
  })

  const envProvider = {
    DEBUG_LEVEL: 'warn',
  }
  const namespace = 'resolve:test-namespace'
  const logger = debugLevels(
    (debugProvider as unknown) as Debug,
    envProvider,
    namespace
  )

  expect(debugNamespaceEnabler).toBeCalledWith('resolve:*')

  logger.log('Log message')
  logger.error('Error message')
  logger.warn('Warn message')
  logger.debug('Debug message')
  logger.info('Info message')
  logger.verbose('Verbose message')

  expect(debugProvider).toBeCalledWith('resolve:test-namespace')

  expect(debugPrinter).toBeCalledWith('Log message')
  expect(debugPrinter).toBeCalledWith('Error message')
  expect(debugPrinter).toBeCalledWith('Warn message')
  expect(debugPrinter).not.toBeCalledWith('Debug message')
  expect(debugPrinter).not.toBeCalledWith('Info message')
  expect(debugPrinter).not.toBeCalledWith('Verbose message')
})

test('should create and invoke logger', () => {
  const logger = createLogger('resolve:test-namespace')

  logger.warn('Warn message')
})
