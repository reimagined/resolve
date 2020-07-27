import givenEvents from '../src/index'
import createReadModelConnector from 'resolve-readmodel-lite'

test('resolve-testing-tools index', async () => {
  const result = await givenEvents([
    { aggregateId: 'id1', type: 'TEST1' },
    { aggregateId: 'id2', type: 'TEST2' },
    { aggregateId: 'id3', type: 'TEST3' }
  ])
    .readModel({
      name: 'readModelName',
      projection: {
        Init: async store => {
          await store.defineTable('items', {
            indexes: { id: 'string' },
            fields: []
          })
        },
        TEST1: async store => {
          await store.insert('items', { id: 1 })
        },
        TEST2: async store => {
          await store.insert('items', { id: 2 })
        },
        TEST3: async store => {
          await store.insert('items', { id: 3 })
        }
      },
      resolvers: {
        all: async (store, args, context) => {
          return {
            items: await store.find('items', {}, { id: 1 }, { id: 1 }),
            args,
            context
          }
        }
      },
      adapter: createReadModelConnector({
        databaseFile: ':memory:'
      })
    })
    .all({ a: 10, b: 20 })
    .as('JWT_TOKEN')

  expect(result).toEqual({
    items: [{ id: 1 }, { id: 2 }, { id: 3 }],
    args: { a: 10, b: 20 },
    context: {
      jwt: 'JWT_TOKEN',
      secretsManager: expect.any(Object)
    }
  })
})

test('bug fix: default secrets manager', async () => {
  await givenEvents([])
    .readModel({
      name: 'readModelName',
      projection: {},
      resolvers: {
        all: async (store, params, { secretsManager }) => {
          secretsManager.setSecret('id', 'secret')
          secretsManager.getSecret('id')
          secretsManager.deleteSecret('id')
        }
      },
      adapter: createReadModelConnector({
        databaseFile: ':memory:'
      })
    })
    .all()
    .as('jwt')
})

test('custom secrets manager', async () => {
  const secretsManager = {
    getSecret: jest.fn(),
    setSecret: jest.fn(),
    deleteSecret: jest.fn()
  }

  await givenEvents([])
    .setSecretsManager(secretsManager)
    .readModel({
      name: 'readModelName',
      projection: {},
      resolvers: {
        all: async (store, params, { secretsManager }) => {
          secretsManager.setSecret('id', 'secret')
          secretsManager.getSecret('id')
          secretsManager.deleteSecret('id')
        }
      },
      adapter: createReadModelConnector({
        databaseFile: ':memory:'
      })
    })
    .all()
    .as('jwt')

  expect(secretsManager.getSecret).toHaveBeenCalledWith('id')
  expect(secretsManager.setSecret).toHaveBeenCalledWith('id', 'secret')
  expect(secretsManager.deleteSecret).toHaveBeenCalledWith('id')
})
