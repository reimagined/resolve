import alias from '../../src/core/alias/$resolve.openBrowser'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const deployOptions = {
    openBrowser: true
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            deployOptions,
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
            deployOptions,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})
