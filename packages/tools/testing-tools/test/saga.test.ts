import { TestSaga } from '../src/types'
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
  const saga: TestSaga<{
    failure: (error: string) => Promise<void>
  }> = {
    name: 'TEST-SAGA',
    handlers: {
      ItemCreated: async ({ sideEffects }, { aggregateId }): Promise<any> => {
        await sideEffects.failure('error')
        await sideEffects.executeCommand({
          type: 'create',
          aggregateName: 'user',
          aggregateId: 'id',
          payload: {
            item: aggregateId,
          },
        })
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
    expect(result.sideEffects).toContainEqual([
      'failure',
      'error',
      expect.any(Object),
    ])
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

  test('shouldExecuteCommand assertion', async () => {
    await givenEvents([
      {
        type: 'ItemCreated',
        aggregateId: 'aggregate-id',
      },
    ])
      .saga(saga)
      .shouldExecuteCommand({
        type: 'create',
        aggregateName: 'user',
        aggregateId: 'id',
        payload: {
          item: 'aggregate-id',
        },
      })
  })
})
