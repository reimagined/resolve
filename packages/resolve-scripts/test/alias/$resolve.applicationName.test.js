import alias from '../../src/core/alias/$resolve.applicationName'
import normalizePaths from './normalize_paths'

test('works correctly', () => {
  const deployOptions = {
    applicationName: 'test'
  }

  expect(
    normalizePaths(
      '\r\n' +
        alias({
          deployOptions
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
