import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import givenEvents from '@resolve-js/testing-tools'

import config from './config'

jest.setTimeout(1000 * 60 * 5)

let warnSpy
let errorSpy

beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => void 0)
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => void 0)
})

afterAll(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
})

describe('Saga', () => {
  const currentSaga = config.sagas.find(
    ({ name }) => name === 'UserConfirmation'
  )
  const { name: sagaName, source: sourceModule, connectorName } = currentSaga
  const {
    module: connectorModule,
    options: connectorOptions,
  } = config.readModelConnectors[connectorName]

  const createConnector = interopRequireDefault(require(connectorModule))
    .default
  const source = interopRequireDefault(require(`./${sourceModule}`)).default

  let sagaWithAdapter = null
  let adapter = null

  describe('with sideEffects.isEnabled = true', () => {
    beforeEach(async () => {
      process.env.RESOLVE_LAUNCH_ID = `${Date.now()}${Math.random()}`
      adapter = createConnector(connectorOptions)
      sagaWithAdapter = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        adapter,
        name: sagaName,
      }
    })

    afterEach(async () => {
      adapter = null
      sagaWithAdapter = null
    })

    test('success registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' },
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' },
        },
        { aggregateId: 'userId', type: 'USER_CONFIRMED', payload: {} },
      ]).saga(sagaWithAdapter)

      expect(result.commands).toEqual([
        {
          aggregateId: 'userId',
          aggregateName: 'User',
          payload: {
            mail: 'user@example.com',
          },
          type: 'requestConfirmUser',
        },
      ])
      expect(result.scheduledCommands).toEqual([
        {
          command: {
            aggregateId: 'userId',
            aggregateName: 'User',
            payload: {},
            type: 'forgetUser',
          },
          date: expect.any(Number),
        },
      ])
      expect(result.sideEffects).toEqual([
        ['sendEmail', 'user@example.com', 'Confirm mail'],
      ])
    })

    test('forgotten registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' },
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' },
        },
        { aggregateId: 'userId', type: 'USER_FORGOTTEN', payload: {} },
      ]).saga(sagaWithAdapter)

      expect(result.commands).toEqual([
        {
          aggregateId: 'userId',
          aggregateName: 'User',
          payload: {
            mail: 'user@example.com',
          },
          type: 'requestConfirmUser',
        },
      ])
      expect(result.scheduledCommands).toEqual([
        {
          command: {
            aggregateId: 'userId',
            aggregateName: 'User',
            payload: {},
            type: 'forgetUser',
          },
          date: expect.any(Number),
        },
      ])
      expect(result.sideEffects).toEqual([
        ['sendEmail', 'user@example.com', 'Confirm mail'],
      ])
    })
  })

  describe('with sideEffects.isEnabled = false', () => {
    beforeEach(async () => {
      process.env.RESOLVE_LAUNCH_ID = `${Date.now()}${Math.random()}`
      adapter = createConnector(connectorOptions)
      sagaWithAdapter = {
        handlers: source.handlers,
        sideEffects: source.sideEffects,
        adapter,
        name: sagaName,
      }
    })

    afterEach(async () => {
      adapter = null
      sagaWithAdapter = null
    })
    // mdis-start saga-test
    test('success registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' },
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' },
        },
        { aggregateId: 'userId', type: 'USER_CONFIRMED', payload: {} },
      ])
        .saga(sagaWithAdapter)
        .startSideEffectsFrom(Number.MAX_VALUE)

      expect(result.commands).toEqual([])
      expect(result.scheduledCommands).toEqual([])
      expect(result.sideEffects).toEqual([])
    })
    // mdis-stop saga-test
    test('forgotten registration', async () => {
      const result = await givenEvents([
        {
          aggregateId: 'userId',
          type: 'USER_CREATED',
          payload: { mail: 'user@example.com' },
        },
        {
          aggregateId: 'userId',
          type: 'USER_CONFIRM_REQUESTED',
          payload: { mail: 'user@example.com' },
        },
        { aggregateId: 'userId', type: 'USER_FORGOTTEN', payload: {} },
      ])
        .saga(sagaWithAdapter)
        .startSideEffectsFrom(Number.MAX_VALUE)

      expect(result.commands).toEqual([])
      expect(result.scheduledCommands).toEqual([])
      expect(result.sideEffects).toEqual([])
    })
  })
})
