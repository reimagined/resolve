import { isEqual } from 'lodash'
import { nanoid } from 'nanoid'
import { Client, createWaitForResponseMiddleware } from '@resolve-js/client'
import { getClient } from '../../utils/utils'

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
        middleware: {
          response: createWaitForResponseMiddleware({
            validator: async (response, confirm) => {
              const result = await response.json()
              if (isEqual(result.data, data)) {
                confirm(result)
              }
            },
            attempts: 5,
            period: 3000,
          }),
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
