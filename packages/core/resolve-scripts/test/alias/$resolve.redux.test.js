import path from 'path'
import alias from '../../src/core/alias/$resolve.redux'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    redux: {
      reducers: {
        testReducerName: path.resolve(__dirname, 'files/testReducer.js')
      },
      middlewares: [path.resolve(__dirname, 'files/testMiddleware.js')],
      sagas: [path.resolve(__dirname, 'files/testSaga.js')],
      enhancers: [path.resolve(__dirname, 'files/testEnhancer.js')]
    }
  }

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
