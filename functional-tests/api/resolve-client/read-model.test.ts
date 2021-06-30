import { URL } from 'url'
import { nanoid } from 'nanoid'
import { Client, QueryResult } from '@resolve-js/client'
import { getClient } from '../../utils/utils'

let client: Client

beforeEach(() => {
  client = getClient({})
})

const registerUser = async (userId: string) =>
  client.command({
    type: 'register',
    aggregateName: 'user',
    aggregateId: userId,
    payload: {
      name: 'John Doe',
    },
  })

test('reactive read model query result contains subscription', async () => {
  const userId = nanoid()
  await registerUser(userId)
  const result = (await client.query({
    name: 'test-scenarios',
    resolver: 'reactiveChannelScenario',
    args: {
      scenarioId: 'id',
    },
  })) as QueryResult

  expect(result.meta).toEqual(
    expect.objectContaining({
      channelPermit: {
        channel: 'test-scenario-id',
        permit: 'allow',
      },
    })
  )

  expect(result.meta?.url).toBeDefined()
})
