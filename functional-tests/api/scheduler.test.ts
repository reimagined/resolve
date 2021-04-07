import { nanoid } from 'nanoid'
import { Client } from '@resolve-js/client'

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
        waitFor: {
          validator: (result) => result?.data != null,
          attempts: 5,
          period: 3000,
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
