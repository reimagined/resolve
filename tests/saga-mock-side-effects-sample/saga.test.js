import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

import config from './config'

jest.setTimeout(1000 * 60 * 5)

describe('Saga', () => {
  const currentSaga = config.sagas.find(({ name }) => name === 'UpdaterSaga')
  const { name: sagaName, source: sourceModule, connectorName } = currentSaga
  const {
    module: connectorModule,
    options: connectorOptions,
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  let saga = null
  let adapter = null

  describe('with sideEffects.isEnabled = true', () => {
    let originalGetRandom = null

    beforeEach(async () => {
      originalGetRandom = source.sideEffects.getRandom
      source.sideEffects.getRandom = jest.fn()

      adapter = createConnector(connectorOptions)
      saga = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        name: sagaName,
      }
    })

    afterEach(async () => {
      source.sideEffects.getRandom = originalGetRandom
      originalGetRandom = null

      adapter = null
      saga = null
    })

    test('success increment', async () => {
      source.sideEffects.getRandom.mockReturnValue(1)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {},
        },
      ])
        .saga(saga)
        .withAdapter(adapter)
        .allowSideEffects()

      expect(result.commands[0].type).toEqual('increment')
    })

    test('success decrement', async () => {
      source.sideEffects.getRandom.mockReturnValue(0)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {},
        },
      ])
        .saga(saga)
        .withAdapter(adapter)
        .allowSideEffects()

      expect(result.commands[0].type).toEqual('decrement')
    })
  })

  describe('with sideEffects.isEnabled = false', () => {
    beforeEach(async () => {
      adapter = createConnector(connectorOptions)
      saga = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        name: sagaName,
      }
    })

    afterEach(async () => {
      adapter = null
      saga = null
    })

    test('do nothing', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {},
        },
      ])
        .saga(saga)
        .withAdapter(adapter)
        .startSideEffectsFrom(Number.MAX_VALUE)

      expect(result).toEqual({
        commands: [],
        scheduledCommands: [],
        sideEffects: [],
        queries: [],
      })
    })
  })
})
