import givenEvents from '../src/index'
import { TestAggregate } from '../types'
import {
  AggregateState,
  EventHandlerEncryptionFactory,
  SecretsManager,
} from '@resolve-js/core'
import { TestReadModel, TestSaga } from '../src/types'

let consoleSpy: jest.SpyInstance

beforeAll(() => {
  consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => void 0)
})

afterAll(() => {
  consoleSpy.mockRestore()
})

const secretsManager: SecretsManager = {
  deleteSecret: jest.fn(),
  getSecret: jest.fn(),
  setSecret: jest.fn(),
}

describe('givenEvents', () => {
  test('incomplete test: should provide test object', async () => {
    expect.assertions(1)
    try {
      await givenEvents()
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining('aggregate'))
    }
  })
})

describe('aggregate', () => {
  const aggregate: TestAggregate = {
    name: 'user',
    projection: {
      Init: (): AggregateState => ({
        exist: false,
      }),
    },
    commands: {
      test: jest.fn(() => ({
        type: 'TEST_COMMAND_EXECUTED',
        payload: {},
      })),
    },
  }

  test('incomplete test: should provide a command', async () => {
    expect.assertions(1)
    try {
      await givenEvents().aggregate(aggregate)
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining('provide a command'))
    }
  })

  test('complete test: user assertion mode', async () => {
    await givenEvents().aggregate(aggregate).command('test')
  })

  test('complete test: user assertion mode with auth', async () => {
    await givenEvents().aggregate(aggregate).command('test').as('user')
  })

  test('init error: setting auth after test execution', async () => {
    const test = givenEvents().aggregate(aggregate).command('test')
    await test
    expect.assertions(1)
    try {
      test.as('user')
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })

  test('complete test: user assertion mode with secrets manager', async () => {
    await givenEvents()
      .aggregate(aggregate)
      .command('test')
      .withSecretsManager(secretsManager)
      .as('user')
  })

  test('init error: setting secrets manager after test execution', async () => {
    const test = givenEvents().aggregate(aggregate).command('test')
    await test
    expect.assertions(1)
    try {
      test.withSecretsManager(secretsManager)
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })
})

describe('read model', () => {
  const readModel: TestReadModel = {
    name: 'readModelName',
    projection: {
      Init: jest.fn(),
    },
    resolvers: {
      profile: jest.fn(),
    },
  }

  test('incomplete test: should provide a query', async () => {
    expect.assertions(1)
    try {
      await givenEvents().readModel(readModel)
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining('provide a query'))
    }
  })

  test('init error: setting secrets manager after test execution', async () => {
    const test = givenEvents().readModel(readModel).query('profile')
    await test
    expect.assertions(1)
    try {
      test.withSecretsManager(secretsManager)
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })

  test('init error: setting auth after test execution', async () => {
    const test = givenEvents().readModel(readModel).query('profile')
    await test
    expect.assertions(1)
    try {
      test.as('user')
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })
})

describe('saga', () => {
  const saga: TestSaga = {
    name: 'TestSaga',
    handlers: {
      dummyHandler: async ({ sideEffects }): Promise<any> => {
        await sideEffects.dummySideEffect()
      },
    },
    sideEffects: {
      dummySideEffect: async () => void 0,
    },
  }
  const makeEncryptionFactory = (): EventHandlerEncryptionFactory => async () => ({
    decrypt: jest.fn(),
    encrypt: jest.fn(),
  })
  test('init error: setting encryption after test execution', async () => {
    const test = givenEvents().saga(saga)
    await test
    expect.assertions(1)
    try {
      test.withEncryption(makeEncryptionFactory())
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })
  test('init error: setting adapter after test execution', async () => {
    const test = givenEvents().saga(saga)
    await test
    expect.assertions(1)
    try {
      test.withAdapter('some-adapter')
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })
})
