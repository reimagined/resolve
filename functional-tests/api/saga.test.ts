import { nanoid } from 'nanoid'
import { Client } from '@resolve-js/client'

import {
  SAGA_TEST_EVENTS_COUNT,
  SAGA_TEST_AGGREGATE_ID,
} from '../utils/constants'

import { getClient } from '../utils/utils'

let client: Client

beforeEach(() => {
  client = getClient()
})

test('executes side effects with "live" events only', async () => {
  {
    const result = await client.query({
      name: 'saga-tests',
      resolver: 'getSucceededSagaTests',
      args: {},
    })

    if (result == null) {
      throw new Error('Empty query result')
    }

    expect(result.data).toEqual([])
  }

  const firstLiveTestId = nanoid()

  await client.command({
    type: 'requestSagaTest',
    aggregateName: 'saga-test',
    aggregateId: SAGA_TEST_AGGREGATE_ID,
    payload: {
      testId: firstLiveTestId,
    },
  })

  {
    const result = await client.query({
      name: 'saga-tests',
      resolver: 'getSucceededSagaTests',
      args: {},
    })

    if (result == null) {
      throw new Error('Empty query result')
    }

    expect(result.data).toEqual([
      {
        id: firstLiveTestId,
        count: 1,
        counterId: SAGA_TEST_EVENTS_COUNT,
      },
    ])
  }

  const secondLiveTestId = nanoid()

  await client.command({
    type: 'requestSagaTest',
    aggregateName: 'saga-test',
    aggregateId: SAGA_TEST_AGGREGATE_ID,
    payload: {
      testId: secondLiveTestId,
    },
  })

  {
    const result = await client.query({
      name: 'saga-tests',
      resolver: 'getSucceededSagaTests',
      args: {},
    })

    if (result == null) {
      throw new Error('Empty query result')
    }

    expect(result.data).toEqual([
      {
        id: firstLiveTestId,
        count: 1,
        counterId: SAGA_TEST_EVENTS_COUNT,
      },
      {
        id: secondLiveTestId,
        count: 1,
        counterId: SAGA_TEST_EVENTS_COUNT + 1,
      },
    ])
  }
})
