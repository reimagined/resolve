import path from 'path'

import alias from '../../src/alias/$resolve.snapshotAdapter'
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

test('works correctly', () => {
  expect(
    normalizePaths(
      '\r\n' +
        alias({
          resolveConfig: {
            snapshotAdapter: {
              module: path.join(__dirname, 'files', 'testSnapshotAdapter.js'),
              options: {}
            }
          }
        }).code +
        '\r\n'
    )
  ).toMatchSnapshot()
})
