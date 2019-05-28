import path from 'path'

import alias from '../../src/alias/$resolve.clientEntry'
import normalizePaths from './normalize_paths'

test('works correctly with custom client index entry point', () => {
  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            index: path.join(__dirname, 'files', 'testClientIndex.js')
          }
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})

test('works correctly with default client index entry point', () => {
  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {}
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
