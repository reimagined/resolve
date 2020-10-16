import { Selector } from 'testcafe'
import fetch from 'isomorphic-fetch'
import { expect } from 'chai'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Shopping List`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('home page', async (t) => {
  await t
    .expect(await Selector('h1').withText('Shopping List').exists)
    .eql(true)
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

  expect(event).to.deep.include({
    type: 'SHOPPING_LIST_CREATED',
    payload: { name: 'List 1' },
    aggregateId: 'shopping-list-1',
    aggregateVersion: 1,
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

  expect(event).to.deep.include({
    type: 'SHOPPING_ITEM_CREATED',
    payload: { id: '1', text: 'Milk' },
    aggregateId: 'shopping-list-1',
    aggregateVersion: 2,
  })
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

    expect(event).to.deep.include(match.event)
  }
})

test('validation should works correctly', async () => {
  const matches = [
    {
      command: {
        aggregateName: 'ShoppingList',
        aggregateId: 'shopping-list-2',
        type: 'createShoppingList',
        payload: {},
      },
      error: 'name is required',
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
      error: 'shopping list already exists',
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
      error: 'shopping list does not exist',
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

    const event = await response.text()

    expect(event).to.include(match.error)
  }
})

test('query should works correctly', async () => {
  const response = await fetch(
    `${MAIN_PAGE}/api/query/shoppingList/shopping-list-1`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    }
  )

  const result = await response.json()

  expect(result.data).to.deep.equal({
    id: 'shopping-list-1',
    name: 'List 1',
    list: [
      {
        id: '1',
        text: 'Milk',
        checked: false,
      },
      {
        id: '2',
        text: 'Eggs',
        checked: false,
      },
      {
        id: '3',
        text: 'Canned beans',
        checked: false,
      },
      {
        id: '4',
        text: 'Paper towels',
        checked: false,
      },
    ],
  })
})
