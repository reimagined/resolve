import givenEvents from '@resolve-js/testing-tools'

import { jestTimeout, adapters, adapterFactory } from '../readmodel-test-utils'
import resolvers from './resolvers'

jest.setTimeout(jestTimeout())
// eslint-disable-next-line no-console
console.error = () => {}

const duplicateTableName = 'duplicate-table-name'

describe(`${adapterFactory.name}. Read-model Store API. Projection with failed Init handler`, () => {
  beforeEach(adapterFactory.create('fail_init_projection'))
  afterEach(adapterFactory.destroy('fail_init_projection'))
  const adapter = adapters['fail_init_projection']

  test(
    [
      `Projection Init Handler`,
      `  store.defineTable(/* tableName: "duplicate-table-name" ... */)`,
      `  store.defineTable(/* tableName: "duplicate-table-name" ... */)`,
      `Should persist Init error in ledger`,
    ].join('\n'),
    async () => {
      const projection = {
        Init: async (store) => {
          await store.defineTable(duplicateTableName, {
            indexes: { testId: 'string' },
            fields: [],
          })

          await store.defineTable(duplicateTableName, {
            indexes: { testId: 'string' },
            fields: [],
          })
        },
      }

      try {
        await givenEvents([])
          .readModel({
            name: 'StoreApi',
            projection,
            resolvers,
          })
          .withAdapter(adapter)
          .query('count', {
            testId: 'testId',
            projection: { testId: 1 },
          })

        return Promise.reject('Test failed')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain(duplicateTableName)
      }
    }
  )
})
