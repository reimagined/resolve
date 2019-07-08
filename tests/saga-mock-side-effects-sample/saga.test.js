import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents, {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP
} from 'resolve-testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

describe('Saga', () => {
  const {
    name: sagaName,
    source: sourceModule,
    connectorName,
    schedulerName
  } = config.sagas.find(({ name }) => name === 'UpdaterSaga')
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  let sagaWithAdapter = null
  let adapter = null

  describe('with sideEffects.isEnabled = true', () => {
    let originalGetRandom = null

    beforeEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)

      originalGetRandom = source.sideEffects.getRandom
      source.sideEffects.getRandom = jest.fn()

      adapter = createConnector(connectorOptions)
      sagaWithAdapter = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        adapter,
        name: sagaName
      }
    })

    afterEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)

      source.sideEffects.getRandom = originalGetRandom
      originalGetRandom = null

      adapter = null
      sagaWithAdapter = null
    })

    test('success increment', async () => {
      source.sideEffects.getRandom.mockReturnValue(1)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {}
        }
      ]).saga(sagaWithAdapter)

      expect(result.commands[0][0].type).toEqual('increment')
    })

    test('success decrement', async () => {
      source.sideEffects.getRandom.mockReturnValue(0)

      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {}
        }
      ]).saga(sagaWithAdapter)

      expect(result.commands[0][0].type).toEqual('decrement')
    })
  })

  describe('with sideEffects.isEnabled = false', () => {
    beforeEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)
      adapter = createConnector(connectorOptions)
      sagaWithAdapter = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        adapter,
        name: sagaName
      }
    })

    afterEach(async () => {
      await resetReadModel(createConnector, connectorOptions, schedulerName)
      await resetReadModel(createConnector, connectorOptions, sagaName)
      adapter = null
      sagaWithAdapter = null
    })

    test('do nothing', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'counterId',
          type: 'UPDATE',
          payload: {}
        }
      ])
        .saga(sagaWithAdapter)
        .properties({
          [RESOLVE_SIDE_EFFECTS_START_TIMESTAMP]: Number.MAX_VALUE
        })

      expect(result).toEqual({
        commands: [],
        scheduleCommands: [],
        sideEffects: [],
        queries: []
      })
    })
  })
})
