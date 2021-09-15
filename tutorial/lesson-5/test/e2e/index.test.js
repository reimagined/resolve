import { Selector, t } from 'testcafe'
import fetch from 'isomorphic-fetch'

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

const refreshAndWait = async (t, selector, expectedValue) => {
  while (true) {
    await t.navigateTo(MAIN_PAGE)

    try {
      await t.expect(await selector()).eql(expectedValue, { timeout: 1000 })
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

test('create first shopping list', async (t) => {
  await t.typeText(Selector('input[type=text]'), 'First Shopping List', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Shopping List'))

  await refreshAndWait(t, () => Selector('td > a').count, 2)
})

test('create second shopping list', async (t) => {
  await t.typeText(Selector('input[type=text]'), 'Second Shopping List', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Shopping List'))

  await refreshAndWait(t, () => Selector('td > a').count, 3)
})

test('create items in first shopping list', async (t) => {
  await t.click(Selector('a').withText('First Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('input[type=text]').nth(1))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 1', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Item'))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 2', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Item'))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 3', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Item'))

  await t.expect(Selector('label').withText('Item 1').exists).eql(true)
  await t.expect(Selector('label').withText('Item 2').exists).eql(true)
  await t.expect(Selector('label').withText('Item 3').exists).eql(true)
})

test('toggle items in first shopping list', async (t) => {
  await t.click(Selector('a').withText('First Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('label').withText('Item 1'))

  await t.click(Selector('label').withText('Item 1').sibling(-1))
  await t
    .expect(Selector('label').withText('Item 1').sibling(-1).checked)
    .eql(true)

  await t.click(Selector('label').withText('Item 2').sibling(-1))
  await t
    .expect(Selector('label').withText('Item 2').sibling(-1).checked)
    .eql(true)

  await t.click(Selector('label').withText('Item 3').sibling(-1))
  await t
    .expect(Selector('label').withText('Item 3').sibling(-1).checked)
    .eql(true)
})

test('remove items in first shopping list', async (t) => {
  await t.click(Selector('a').withText('First Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('button').withText('Delete'))

  await t.click(Selector('Button').withText('Delete'))
  await t.click(Selector('Button').withText('Delete'))
  await t.click(Selector('Button').withText('Delete'))

  await t.expect(await Selector('td > a').count).eql(0)
})

test('create items in second shopping list', async (t) => {
  await t.click(Selector('a').withText('Second Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('input[type=text]').nth(1))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 1', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Item'))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 2', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Item'))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 3', {
    paste: true,
  })
  await t.click(Selector('button').withText('Add Item'))

  await t.expect(Selector('label').withText('Item 1').exists).eql(true)
  await t.expect(Selector('label').withText('Item 2').exists).eql(true)
  await t.expect(Selector('label').withText('Item 3').exists).eql(true)
})

test('toggle items in second shopping list', async (t) => {
  await t.click(Selector('a').withText('Second Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('label').withText('Item 1'))

  await t.click(Selector('label').withText('Item 1').sibling(-1))
  await t
    .expect(Selector('label').withText('Item 1').sibling(-1).checked)
    .eql(true)

  await t.click(Selector('label').withText('Item 2').sibling(-1))
  await t
    .expect(Selector('label').withText('Item 2').sibling(-1).checked)
    .eql(true)

  await t.click(Selector('label').withText('Item 3').sibling(-1))
  await t
    .expect(Selector('label').withText('Item 3').sibling(-1).checked)
    .eql(true)
})

test('remove items in second shopping list', async (t) => {
  await t.click(Selector('a').withText('Second Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('button').withText('Delete'))

  await t.click(Selector('Button').withText('Delete'))
  await t.click(Selector('Button').withText('Delete'))
  await t.click(Selector('Button').withText('Delete'))

  await t.expect(await Selector('td > a').count).eql(0)
})

test('remove shopping lists', async (t) => {
  await t.click(Selector('Button').withText('Delete'))
  await t.click(Selector('Button').withText('Delete'))
  await t.click(Selector('Button').withText('Delete'))

  await t.expect(await Selector('td > a').count).eql(0)
})
