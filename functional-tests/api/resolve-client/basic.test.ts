import { isEqual } from 'lodash'
import { nanoid } from 'nanoid'
import { Client } from 'resolve-client'
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

const waitForUserProfile = async (userId: string, data: object) => {
  let lastResult = null
  try {
    return await client.query(
      {
        name: 'users',
        resolver: 'profile',
        args: {
          userId,
        },
      },
      {
        waitFor: {
          validator: (result: any) => {
            lastResult = result
            return isEqual(result.data, data)
          },
          attempts: 5,
          period: 3000,
        },
      }
    )
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(lastResult)
    throw e
  }
}

test('execute register command and check the result', async () => {
  const userId = nanoid()
  const result = await registerUser(userId)
  expect(result).toBeDefined()
})

test('execute read-model query and check the result', async () => {
  const userId = nanoid()
  await registerUser(userId)
  await waitForUserProfile(userId, {
    userId,
    profile: { name: 'John Doe' },
  })
})
