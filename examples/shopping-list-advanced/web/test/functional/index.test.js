import { Selector } from 'testcafe'
import fetch from 'isomorphic-fetch'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

const getRootBasedUrl = (url) => MAIN_PAGE + url

const registerFirstUser = async (t) => {
  await t.navigateTo(getRootBasedUrl('/login'))
  await t.typeText(await Selector('input[name="username"]'), 'User 1')
  await t.typeText(await Selector('input[name="password"]'), 'User Password 1')
  await t.click(await Selector('.btn-success'))

  // eslint-disable-next-line no-restricted-globals
  await t.eval(() => location.reload(true))
}

const loginFirstUser = async (t) => {
  await t.navigateTo(getRootBasedUrl('/login'))
  await t.typeText(await Selector('input[name="username"]'), 'User 1')
  await t.typeText(await Selector('input[name="password"]'), 'User Password 1')
  await t.click(await Selector('.btn-primary'))
}

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
fixture`Shopping Lists`

test('should list be empty', async (t) => {
  await registerFirstUser(t)

  await refreshAndWait(t, () => Selector('.shopping-list').count, 1)
})

test('create first shopping list', async (t) => {
  await loginFirstUser(t)

  await waitSelector(t, 'ShoppingLists', Selector('.example-form-control'))

  await t.typeText(
    await Selector('.example-form-control'),
    'First Shopping List'
  )
  await t.click(await Selector('button').withText('Add Shopping List'))

  await refreshAndWait(t, () => Selector('.shopping-list').count, 2)
})

test('create second shopping list', async (t) => {
  await loginFirstUser(t)

  await waitSelector(t, 'ShoppingLists', Selector('.example-form-control'))

  await t.typeText(
    await Selector('.example-form-control'),
    'Second Shopping List'
  )
  await t.click(await Selector('button').withText('Add Shopping List'))

  await refreshAndWait(t, () => Selector('.shopping-list').count, 3)
})

test('create items in first shopping list', async (t) => {
  await loginFirstUser(t)

  await waitSelector(
    t,
    'ShoppingLists',
    Selector('a').withText('First Shopping List')
  )

  await t.click(Selector('a').withText('First Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('input[type=text]').nth(1))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 1')
  await t.click(Selector('button').withText('Add Item'))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 2')
  await t.click(Selector('button').withText('Add Item'))

  await t.typeText(Selector('input[type=text]').nth(1), 'Item 3')
  await t.click(Selector('button').withText('Add Item'))

  await t.expect(Selector('label').withText('Item 1').exists).eql(true)
  await t.expect(Selector('label').withText('Item 2').exists).eql(true)
  await t.expect(Selector('label').withText('Item 3').exists).eql(true)
})

test('toggle items in first shopping list', async (t) => {
  await loginFirstUser(t)

  await waitSelector(
    t,
    'ShoppingLists',
    Selector('a').withText('First Shopping List')
  )

  await t.click(Selector('a').withText('First Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('label').withText('Item 1'))

  await t.click(Selector('label').withText('Item 1'))
  await t.click(Selector('label').withText('Item 2'))
  await t.click(Selector('label').withText('Item 3'))

  await t
    .expect(Selector('label > input[type=checkbox]').nth(0).checked)
    .eql(true)
  await t
    .expect(Selector('label > input[type=checkbox]').nth(1).checked)
    .eql(true)
  await t
    .expect(Selector('label > input[type=checkbox]').nth(2).checked)
    .eql(true)
})

test('remove items in first shopping list', async (t) => {
  await loginFirstUser(t)

  await waitSelector(
    t,
    'ShoppingLists',
    Selector('a').withText('First Shopping List')
  )

  await t.click(Selector('a').withText('First Shopping List'))

  await waitSelector(t, 'ShoppingLists', Selector('.example-close-button'))

  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))

  await t.expect(Selector('.shopping-list').count).eql(0)
})
