import alias from '../../src/alias/$resolve.eventBrokerConfig'
import declareRuntimeEnv from '../../src/declare_runtime_env'
import normalizePaths from './normalize_paths'

test('should fail when imported from client', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {},
          isClient: true,
        }) +
        '\r\n'
    )
  ).toThrow()
})

test('should fail if "launchBroker" is runtime injection', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            eventBroker: {
              launchBroker: declareRuntimeEnv('true'),
              publisherAddress: declareRuntimeEnv('publisherAddress'),
              consumerAddress: declareRuntimeEnv('consumerAddress'),
              databaseFile: 'databaseFile',
              batchSize: 100,
              upstream: true,
            },
          },
        }) +
        '\r\n'
    )
  ).toThrow()
})

test('works correctly', () => {
  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            eventBroker: {
              launchBroker: true,
              publisherAddress: declareRuntimeEnv('publisherAddress'),
              consumerAddress: declareRuntimeEnv('consumerAddress'),
              databaseFile: declareRuntimeEnv('databaseFile'),
              batchSize: 100,
              upstream: true,
            },
          },
        }) +
        '\r\n'
    )
  ).toMatchSnapshot()
})
