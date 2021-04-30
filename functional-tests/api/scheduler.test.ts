import { nanoid } from 'nanoid'
import { Client, createWaitForResponseMiddleware } from '@resolve-js/client'

import { getClient } from '../utils/utils'

let client: Client

beforeEach(() => {
  client = getClient()
})

test('executes scheduled command correctly', async () => {
  const testId = nanoid()

  {
    const result = await client.query({
      name: 'scheduler-tests',
      resolver: 'getSucceededSagaSchedulerTests',
      args: { id: testId },
    })

    if (result == null) {
      throw new Error('Empty query result')
    }

    expect(result.data).toEqual(null)
  }

  await client.command({
    type: 'requestSagaSchedulerTest',
    aggregateName: 'scheduler-test',
    aggregateId: nanoid(),
    payload: {
      testId,
    },
  })

  {
    const result = await client.query(
      {
        name: 'scheduler-tests',
        resolver: 'getSucceededSagaSchedulerTests',
        args: { id: testId },
      },
      {
        middleware: {
          response: createWaitForResponseMiddleware({
            validator: async (response, confirm) => {
              if (response.ok) {
                const result = await response.json()
                if (result.data != null) {
                  confirm(result)
                }
              }
            },
            attempts: 5,
            period: 3000,
          }),
        },
      }
    )

    if (result == null) {
      throw new Error('Empty query result')
    }

    expect(result.data).toEqual({
      id: testId,
    })
  }
})
