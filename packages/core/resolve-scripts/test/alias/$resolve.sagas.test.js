import path from 'path'
import alias from '../../src/alias/$resolve.sagas'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    sagas: [
      {
        name: 'Saga',
        cronHandlers: path.resolve(__dirname, 'files/testSagaCronHandlers.js'),
        eventHandlers: path.resolve(__dirname, 'files/testSagaEventHandlers.js')
      }
    ]
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
