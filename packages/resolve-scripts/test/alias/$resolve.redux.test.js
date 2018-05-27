import path from 'path'

import alias from '../../src/core/alias/$resolve.redux'

describe('base config works correctly', () => {
  const resolveConfig = {
    redux: {
      reducers: path.resolve(__dirname, 'files/testReducers.js'),
      middlewares: path.resolve(__dirname, 'files/testMiddlewares.js'),
      store: path.resolve(__dirname, 'files/testStore.js')
    }
  }

  test('[client]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: true
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })

  test('[server]', () => {
    expect(
      '\r\n' +
        alias({
          resolveConfig,
          isClient: false
        }).code +
        '\r\n'
    ).toMatchSnapshot()
  })
})
