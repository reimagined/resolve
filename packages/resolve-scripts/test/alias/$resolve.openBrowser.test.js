import alias from '../../src/core/alias/$resolve.openBrowser'

describe('base config works correctly', () => {
  const deployOptions = {
    openBrowser: true
  }

  test('[client]', () => {
    expect(
      () =>
        '\r\n' +
        alias({
          deployOptions,
          isClient: true
        }).code +
        '\r\n'
    ).toThrow()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          deployOptions,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})
