import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from 'resolve-testing-tools'

import config from './config'

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
    adapter = createConnector(connectorOptions)
    try {
      await adapter.drop(null, name)
    } catch (e) {}

    sagaWithAdapter = {
      handlers: source.handlers,
      sideEffects: source.sideEffects,
      adapter
    }
  })

  afterEach(async () => {
    try {
      await adapter.drop(null, name)
    } catch (e) {}
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
})
