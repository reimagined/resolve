import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents, {
  RESOLVE_SIDE_EFFECTS_START_TIMESTAMP
} from 'resolve-testing-tools'

import config from './config'
import resetReadModel from '../reset-read-model'

describe('Saga', () => {
  const { name, source: sourceModule, connectorName } = config.sagas.find(
    ({ name }) => name === 'UserConfirmation'
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
    test('success registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' }
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' }
        },
        { aggregateId: 'userId', type: 'USER_CONFIRMED', payload: {} }
      ]).saga(sagaWithAdapter)

      expect(result).toMatchSnapshot()
    })

    test('forgotten registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' }
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' }
        },
        { aggregateId: 'userId', type: 'USER_FORGOTTEN', payload: {} }
      ]).saga(sagaWithAdapter)

      expect(result).toMatchSnapshot()
    })
  })

  describe('with sideEffects.isEnabled = false', () => {
    test('success registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' }
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' }
        },
        { aggregateId: 'userId', type: 'USER_CONFIRMED', payload: {} }
      ])
        .saga(sagaWithAdapter)
        .properties({
          [RESOLVE_SIDE_EFFECTS_START_TIMESTAMP]: Number.MAX_VALUE
        })

      expect(result).toMatchSnapshot()
    })

    test('forgotten registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' }
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' }
        },
        { aggregateId: 'userId', type: 'USER_FORGOTTEN', payload: {} }
      ])
        .saga(sagaWithAdapter)
        .properties({
          [RESOLVE_SIDE_EFFECTS_START_TIMESTAMP]: Number.MAX_VALUE
        })

      expect(result).toMatchSnapshot()
    })
  })
})
