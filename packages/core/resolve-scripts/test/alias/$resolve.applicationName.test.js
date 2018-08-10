import alias from '../../src/core/alias/$resolve.applicationName'
import normalizePaths from './normalize_paths'

test('works correctly', () => {
  const resolveConfig = {
    applicationName: 'test'
  }

  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
