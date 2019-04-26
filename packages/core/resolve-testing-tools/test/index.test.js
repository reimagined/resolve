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
        all: async (store, args, jwtToken) => {
          return {
            items: await store.find('items', {}, { id: 1 }, { id: 1 }),
            args,
            jwtToken
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
    jwtToken: 'JWT_TOKEN'
  })
})
