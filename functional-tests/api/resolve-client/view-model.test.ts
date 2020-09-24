import { nanoid } from 'nanoid'
import { Client, QueryResult } from 'resolve-client'
import { getClient } from './get-client'

let client: Client

beforeEach(() => {
  client = getClient()
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

test('custom view model state serialization ', async () => {
  const userId = nanoid()
  await registerUser(userId)
  const result = (await client.query({
    name: 'custom-serializer',
    aggregateIds: [userId],
    args: {},
  })) as QueryResult
  expect(result.data).toEqual({
    id: userId,
    nickname: 'John Doe',
  })
})
