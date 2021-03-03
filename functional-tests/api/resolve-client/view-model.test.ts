import { nanoid } from 'nanoid'
import { Client, QueryResult } from '@resolve-js/client'
import { getClient } from '../../utils/utils'
import deserializeState from '../../app/common/view-models/custom-serializer.deserialize'

let client: Client

beforeEach(() => {
  client = getClient({
    viewModels: [
      {
        name: 'custom-serializer',
        deserializeState,
        projection: {
          Init: () => null,
        },
      },
    ],
  })
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
    name: 'John Doe',
  })
})
