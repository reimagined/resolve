import { Selector } from 'testcafe'
import fetch from 'isomorphic-fetch'
import { expect } from 'chai'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

const waitSelector = async (t, eventSubscriber, selector) => {
  while (true) {
    const res = await fetch(`${MAIN_PAGE}/api/event-broker/read-models-list`)

    const readModel = (await res.json()).find(
      (readModel) => readModel.eventSubscriber === eventSubscriber
    )

    if (readModel.status !== 'deliver') {
      throw new Error(`Test failed. Read-model status "${readModel.status}"`)
    }

    try {
      await t.expect((await selector).exists).eql(true)
      break
    } catch (e) {}
  }
}

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Shopping List`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
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

    const event = await response.text()

    expect(event).to.include(match.error)
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

  expect(result.data).to.have.lengthOf(1)
  expect(result.data[0]).to.include({
    id: 'shopping-list-1',
    name: 'List 1',
  })
})

test('shopping list is displayed on page', async (t) => {
  await t.expect(Selector('td').withText('1').exists).eql(true)
  await t.expect(Selector('td').withText('List 1').exists).eql(true)
})

test('shopping list items are displayed on page', async (t) => {
  await t.click(Selector('a').withText('List 1'))
  await waitSelector(t, 'ShoppingLists', Selector('div.list-group-item'))
  await t.expect(Selector('label').withText('Milk').exists).eql(true)
  await t.expect(Selector('label').withText('Eggs').exists).eql(true)
  await t.expect(Selector('label').withText('Canned beans').exists).eql(true)
  await t.expect(Selector('label').withText('Paper towels').exists).eql(true)
})
