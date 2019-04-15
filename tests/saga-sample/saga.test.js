import createReadModelConnector from 'resolve-readmodel-lite'
import givenEvents from 'resolve-testing-tools'

import saga from './saga'

describe('Saga', () => {
  let sagaWithAdapter = null

  beforeEach(() => {
    sagaWithAdapter = Object.create(saga, {
      adapter: {
        value: createReadModelConnector({
          databaseFile: ':memory:'
        })
      }
    })
  })

  afterEach(() => {
    sagaWithAdapter = null
  })

  test('success registration', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'userId',
        type: 'USER_CREATED',
        payload: { mail: 'user@example.com' }
      },
      {
        aggregateId: 'userId',
        type: 'USER_CONFIRM_REQUESTED',
        payload: { mail: 'user@example.com' }
      },
      { aggregateId: 'userId', type: 'USER_CONFIRMED', payload: {} }
    ]).saga(sagaWithAdapter)

    expect(result).toMatchSnapshot()
  })

  test('forgotten registration', async () => {
    const result = await givenEvents([
      {
        aggregateId: 'userId',
        type: 'USER_CREATED',
        payload: { mail: 'user@example.com' }
      },
      {
        aggregateId: 'userId',
        type: 'USER_CONFIRM_REQUESTED',
        payload: { mail: 'user@example.com' }
      },
      { aggregateId: 'userId', type: 'USER_FORGOTTEN', payload: {} }
    ]).saga(sagaWithAdapter)

    expect(result).toMatchSnapshot()
  })
})
