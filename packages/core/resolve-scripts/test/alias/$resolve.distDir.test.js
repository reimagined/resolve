import alias from '../../src/alias/$resolve.distDir'
import normalizePaths from './normalize_paths'
import declareRuntimeEnv from '../../src/declare_runtime_env'

test('should fail when imported from client', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            distDir: 'distDir'
          },
          isClient: true
        }).code +
        '\r\n'
    )
  ).toThrow()
})

test('should fail when runtime env provided', () => {
  expect(() =>
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            distDir: declareRuntimeEnv('distDir')
          }
        }).code +
        '\r\n'
    )
  ).toThrow()
})

test('should work correctly', () => {
  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            distDir: 'distDir'
          }
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
