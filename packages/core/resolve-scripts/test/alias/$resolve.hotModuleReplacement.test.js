import alias from '../../src/alias/$resolve.hotModuleReplacement'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {}

  test('[server]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false
          }).code +
          '\r\n'
      )
    ).toThrow()
  })

  test('[client]', () => {
    expect(
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true
          }).code +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})
