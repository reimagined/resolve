import { nanoid } from 'nanoid'
import {
  Client,
  createRetryOnErrorMiddleware,
  QueryResult,
} from '@resolve-js/client'
import { getClient } from '../../utils/utils'

let client: Client

beforeEach(() => {
  client = getClient()
})

const registerUser = async (userId: string, creditCard: string) =>
  client.command({
    type: 'register',
    aggregateName: 'user',
    aggregateId: userId,
    payload: {
      name: 'John Doe',
      creditCard,
    },
  })

const waitForPersonalData = async (userId: string) =>
  client.query(
    {
      name: 'personal-data',
      resolver: 'get',
      args: {
        userId,
      },
    },
    {
      middleware: {
        error: createRetryOnErrorMiddleware({
          errors: [404, 500],
          debug: true,
          attempts: 5,
          period: 3000,
        }),
      },
    }
  )

test('personal data decoded within read-model event handler', async () => {
  const userId = nanoid()
  await registerUser(userId, '0000111122223333')
  const result = (await waitForPersonalData(userId)) as QueryResult

  const {
    data: { plainCreditCard, encryptedCreditCard },
  } = result
  expect(plainCreditCard).toEqual('0000111122223333')
  expect(encryptedCreditCard).toBeDefined()
  expect(typeof encryptedCreditCard).toEqual('string')
  expect(encryptedCreditCard).not.toEqual('0000111122223333')
  expect(encryptedCreditCard.length).toBeGreaterThan(0)
})
