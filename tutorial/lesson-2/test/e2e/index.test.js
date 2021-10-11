import { Selector, t } from 'testcafe'
import fetch from 'isomorphic-fetch'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`
// eslint-disable-next-line no-unused-expressions, no-undef
fixture`reSolve Application`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
})

test('createShoppingList', async () => {
  const command = {
    aggregateName: 'ShoppingList',
    aggregateId: 'shopping-list-1',
    type: 'createShoppingList',
    payload: {
      name: 'List 1',
    },
  }

  const response = await fetch(`${MAIN_PAGE}/api/commands`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(command),
  })

  const event = await response.json()

  await t
    .expect(event)
    .contains({
      type: 'SHOPPING_LIST_CREATED',
      aggregateId: 'shopping-list-1',
      aggregateVersion: 1,
    })
    .expect(event.payload)
    .contains({
      name: 'List 1',
    })
})

test('createShoppingItem', async () => {
  const command = {
    aggregateName: 'ShoppingList',
    aggregateId: 'shopping-list-1',
    type: 'createShoppingItem',
    payload: {
      id: '1',
      text: 'Milk',
    },
  }

  const response = await fetch(`${MAIN_PAGE}/api/commands`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(command),
  })

  const event = await response.json()

  await t
    .expect(event)
    .contains({
      type: 'SHOPPING_ITEM_CREATED',
      aggregateId: 'shopping-list-1',
      aggregateVersion: 2,
    })
    .expect(event.payload)
    .contains({ id: '1', text: 'Milk' })
})

test('createShoppingItems', async () => {
  const matches = [
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-1',
        type: 'createShoppingItem',
        payload: {
          id: '2',
          text: 'Eggs',
        },
      },
      event: {
        type: 'SHOPPING_ITEM_CREATED',
        payload: { id: '2', text: 'Eggs' },
        aggregateId: 'shopping-list-1',
        aggregateVersion: 3,
      },
    },
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-1',
        type: 'createShoppingItem',
        payload: {
          id: '3',
          text: 'Canned beans',
        },
      },
      event: {
        type: 'SHOPPING_ITEM_CREATED',
        payload: { id: '3', text: 'Canned beans' },
        aggregateId: 'shopping-list-1',
        aggregateVersion: 4,
      },
    },
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-1',
        type: 'createShoppingItem',
        payload: {
          id: '4',
          text: 'Paper towels',
        },
      },
      event: {
        type: 'SHOPPING_ITEM_CREATED',
        payload: { id: '4', text: 'Paper towels' },
        aggregateId: 'shopping-list-1',
        aggregateVersion: 5,
      },
    },
  ]

  for (const match of matches) {
    const response = await fetch(`${MAIN_PAGE}/api/commands`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(match.command),
    })

    const event = await response.json()

    await t
      .expect(event)
      .contains({
        aggregateId: match.event.aggregateId,
        aggregateVersion: match.event.aggregateVersion,
        type: match.event.type,
      })
      .expect(event.payload)
      .contains(match.event.payload)
  }
})

test('validation should work correctly', async () => {
  const matches = [
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-2',
        type: 'createShoppingList',
        payload: {},
      },
      error: 'The "name" field is required',
    },
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-1',
        type: 'createShoppingList',
        payload: {
          name: 'List 1',
        },
      },
      error: 'Shopping list already exists',
    },
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-4000',
        type: 'createShoppingItem',
        payload: {
          id: '5',
          text: 'Bread',
        },
      },
      error: 'Shopping list does not exist',
    },
  ]

  for (const match of matches) {
    const response = await fetch(`${MAIN_PAGE}/api/commands`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(match.command),
    })

    const error = await response.text()

    await t.expect(error).contains(match.error)
  }
})

test('read model query should work correctly', async () => {
  const response = await fetch(`${MAIN_PAGE}/api/query/ShoppingLists/all`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })

  const result = await response.json()

  await t.expect(result.data.length).eql(1)
  await t.expect(result.data[0]).contains({
    id: 'shopping-list-1',
    name: 'List 1',
  })
})