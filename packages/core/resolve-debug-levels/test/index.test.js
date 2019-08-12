import createLogger, { debugLevels } from '../src/index'

test('resolve-debug-levels should work with provided DEBUG and DEBUG_LEVELS envs', () => {
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  const envProvider = {
    DEBUG: 'namespace',
    DEBUG_LEVEL: 'warn'
  }
  const namespace = 'namespace'
  const logger = debugLevels(debugProvider, envProvider, namespace)

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

test('resolve-debug-levels should set DEBUG_LEVELS="warn" if DEBUG_LEVELS env is not set', () => {
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  const envProvider = {
    DEBUG: 'namespace'
  }
  const namespace = 'namespace'
  const logger = debugLevels(debugProvider, envProvider, namespace)

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

test('resolve-debug-levels should fail with wrong DEBUG_LEVELS env', () => {
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  const envProvider = {
    DEBUG: 'namespace',
    DEBUG_LEVEL: 'wrong-level'
  }
  const namespace = 'namespace'

  expect(() => debugLevels(debugProvider, envProvider, namespace)).toThrowError(
    `Log level wrong-level is not found in allowed levels`
  )
})

test('resolve-debug-levels should set DEBUG="resolve:" if DEBUG env is not set', () => {
  const debugNamespaceEnabler = jest.fn()
  const debugPrinter = jest.fn()
  const debugProvider = jest.fn().mockReturnValue(debugPrinter)
  Object.defineProperty(debugProvider, 'enable', {
    value: debugNamespaceEnabler
  })

  const envProvider = {
    DEBUG_LEVEL: 'warn'
  }
  const namespace = 'resolve:test-namespace'
  const logger = debugLevels(debugProvider, envProvider, namespace)

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

test('resolve-debug-levels should create and invoke logger', () => {
  const logger = createLogger('resolve:test-namespace')

  logger.warn('Warn message')
})
