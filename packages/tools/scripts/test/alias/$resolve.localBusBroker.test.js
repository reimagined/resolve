import alias from '../../src/alias/$resolve.localBusBroker'
import normalizePaths from './normalize_paths'

describe('local config works correctly', () => {
  const resolveConfig = {
    target: 'local',
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true,
          }) +
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
            isClient: false,
          }) +
          '\r\n'
      )
    ).toMatchSnapshot()
  })
})

describe('cloud config works correctly', () => {
  const resolveConfig = {
    target: 'cloud',
  }

  test('[client]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: true,
          }) +
          '\r\n'
      )
    ).toThrow()
  })

  test('[server]', () => {
    expect(() =>
      normalizePaths(
        '\r\n' +
          alias({
            resolveConfig,
            isClient: false,
          }) +
          '\r\n'
      )
    ).toThrow()
  })
})
