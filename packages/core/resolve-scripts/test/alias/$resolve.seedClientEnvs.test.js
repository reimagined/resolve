import alias from '../../src/alias/$resolve.seedClientEnvs'
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

test('works correctly', () => {
  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            customConstants: declareRuntimeEnv('customConstants'),
            staticPath: declareRuntimeEnv('staticPath'),
            rootPath: declareRuntimeEnv('rootPath'),
          },
        }) +
        '\r\n'
    )
  ).toMatchSnapshot()
})

// resolveConfig, isClient
