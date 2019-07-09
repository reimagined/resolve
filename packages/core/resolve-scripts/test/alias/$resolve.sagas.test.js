import path from 'path'
import alias from '../../src/alias/$resolve.sagas'
import normalizePaths from './normalize_paths'

describe('base config works correctly', () => {
  const resolveConfig = {
    readModels: [],
    sagas: [
      {
        name: 'Saga',
        source: path.resolve(__dirname, 'files/testSagaCronHandlers.js')
      }
    ],
    schedulers: {}
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

describe('config with schedulers works correctly', () => {
  const resolveConfig = {
    readModels: [],
    sagas: [
      {
        name: 'Saga',
        source: path.resolve(__dirname, 'files/testSagaCronHandlers.js')
      }
    ],
    schedulers: {
      scheduler: {
        adapter: {
          module: 'resolve-scheduler-local',
          options: {}
        },
        connectorName: 'default'
      }
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
