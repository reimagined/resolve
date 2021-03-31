import givenEvents from '../src/index'
import { BDDAggregate } from '../types'
import { AggregateState, SecretsManager } from '@resolve-js/core'
import { BDDReadModel } from '../src/types'

let consoleSpy: jest.SpyInstance

beforeAll(() => {
  consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => void 0)
})

afterAll(() => {
  consoleSpy.mockRestore()
})

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
  const aggregate: BDDAggregate = {
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
  const secretsManager: SecretsManager = {
    deleteSecret: jest.fn(),
    getSecret: jest.fn(),
    setSecret: jest.fn(),
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

  test('(deprecated) complete test: user assertion mode with secrets manager', async () => {
    await givenEvents()
      .aggregate(aggregate)
      .command('test')
      .setSecretsManager(secretsManager)
  })

  test('(deprecated) init error: setting secrets manager after test execution', async () => {
    const test = givenEvents().aggregate(aggregate).command('test')
    await test
    expect.assertions(1)
    try {
      test.setSecretsManager(secretsManager)
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining(`cannot be assigned`))
    }
  })
})

describe('read model', () => {
  const readModel: BDDReadModel = {
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

  test('(deprecated) support direct resolver binding (should not throw)', async () => {
    await givenEvents().readModel(readModel).profile()
  })

  test('(deprecated) adapter set within read model', async () => {
    expect.assertions(1)
    try {
      await givenEvents()
        .readModel({
          ...readModel,
          adapter: 'adapter',
        })
        .withAdapter('another-adapter')
    } catch (e) {
      expect(e.message).toEqual(expect.stringContaining('already assigned'))
    }
  })
})

test('saga', async () => {
  givenEvents().saga()
})
