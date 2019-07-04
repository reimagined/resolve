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
  } = config.sagas.find(({ name }) => name === 'UserConfirmation')
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
