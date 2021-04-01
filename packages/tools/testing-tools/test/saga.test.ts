import { BDDSaga } from '../src/types'
import givenEvents from '../src/index'

let warnSpy: jest.SpyInstance
let errorSpy: jest.SpyInstance

beforeAll(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => void 0)
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => void 0)
})

afterAll(() => {
  warnSpy.mockRestore()
  errorSpy.mockRestore()
})

describe('basic tests', () => {
  const saga: BDDSaga<{
    failure: (error: string) => Promise<void>
  }> = {
    name: 'TEST-SAGA',
    handlers: {
      ItemCreated: async ({ sideEffects }): Promise<any> => {
        await sideEffects.failure('error')
      },
    },
    sideEffects: {
      failure: async (error: string) => {
        throw Error(error)
      },
    },
  }

  test('side effects mocked by default', async () => {
    const result = await givenEvents([
      {
        type: 'ItemCreated',
        aggregateId: 'aggregate-id',
      },
    ]).saga(saga)
    expect(result.sideEffects).toContainEqual(['failure', 'error', {}])
  })

  test('allow side effects', async () => {
    await expect(
      givenEvents([
        {
          type: 'ItemCreated',
          aggregateId: 'aggregate-id',
        },
      ])
        .saga(saga)
        .allowSideEffects()
    ).rejects.toThrowError('error')
  })
})
