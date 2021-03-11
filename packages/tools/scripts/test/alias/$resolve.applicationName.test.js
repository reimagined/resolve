import alias from '../../src/alias/$resolve.applicationName'
import normalizePaths from './normalize_paths'

test('works correctly', () => {
  const resolveConfig = { name: null }

  expect(
    normalizePaths('\r\n' + alias({ resolveConfig }) + '\r\n')
  ).toMatchSnapshot()
})
