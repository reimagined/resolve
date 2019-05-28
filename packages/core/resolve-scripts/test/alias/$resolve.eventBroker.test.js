import alias from '../../src/alias/$resolve.eventBroker'
import declareRuntimeEnv from '../../src/declare_runtime_env'
import normalizePaths from './normalize_paths'

test('should fail when imported from client', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {},
          isClient: true
        }).code +
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
              zmqBrokerAddress: 'zmqBrokerAddress',
              zmqConsumerAddress: 'zmqConsumerAddress',
              databaseFile: 'databaseFile',
              batchSize: 100,
              upstream: true
            }
          }
        }).code +
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
              zmqBrokerAddress: declareRuntimeEnv('zmqBrokerAddress'),
              zmqConsumerAddress: declareRuntimeEnv('zmqConsumerAddress'),
              databaseFile: declareRuntimeEnv('databaseFile'),
              batchSize: 100,
              upstream: true
            }
          }
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
