import { BDDSaga } from '../src/types'
import givenEvents from '../src/index'

describe('basic tests', () => {
  const saga: BDDSaga = {
    name: 'TEST-SAGA',
    handlers: {
      ItemCreated: async ({ sideEffects }): Promise<any> => {
        await sideEffects.failure()
      },
    },
    sideEffects: {
      failure: async (error: string) => {
        throw Error(error)
      },
    },
  }

  test('side effects mocked by default', async () => {
    await givenEvents([
      {
        type: 'ItemCreated',
        aggregateId: 'aggregate-id',
      },
    ]).saga(saga)
  })
})
