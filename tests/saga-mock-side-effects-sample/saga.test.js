import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents, {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP
} from 'resolve-testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

describe('Saga', () => {
  const { name, source: sourceModule, connectorName } = config.sagas.find(
    ({ name }) => name === 'UpdaterSaga'
  )
  const {
    module: connectorModule,
    options: connectorOptions
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  let sagaWithAdapter = null
  let adapter = null

  beforeEach(async () => {
    await resetReadModel(createConnector, connectorOptions, name)
    adapter = createConnector(connectorOptions)
    sagaWithAdapter = {
      handlers: source.handlers,
      sideEffects: source.sideEffects,
      adapter
    }
  })

  afterEach(async () => {
    await resetReadModel(createConnector, connectorOptions, name)
    adapter = null
    sagaWithAdapter = null
  })

  describe('with sideEffects.isEnabled = true', () => {
    let originalGetRandom = null

    beforeEach(() => {
      originalGetRandom = source.sideEffects.getRandom
      source.sideEffects.getRandom = jest.fn()
    })

    afterEach(() => {
      source.sideEffects.getRandom = originalGetRandom
      originalGetRandom = null
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
