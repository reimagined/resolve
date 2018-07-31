import path from 'path'
import alias from '../../src/core/alias/$resolve.auth'
import normalizePaths from './normalize_paths'

describe('works correctly', () => {
  const resolveConfig = {
    auth: {
      strategies: path.resolve(__dirname, 'files/testStrategies.js')
    }
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})
