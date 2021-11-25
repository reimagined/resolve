import alias from '../../src/alias/$resolve.backendEntry'
import normalizePaths from './normalize_paths'

test('works correctly', async () => {
  const code = normalizePaths(
    '\r\n' +
      (await alias({
        resolveConfig: {
          runtime: {
            module: '@resolve-js/runtime-aws-serverless',
            options: {
              importMode: 'dynamic',
            },
          },
        },
      })) +
      '\r\n'
  )
  expect(code).not.toContain('moduleImport')
})
