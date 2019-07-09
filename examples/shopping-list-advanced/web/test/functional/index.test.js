import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

const getRootBasedUrl = url => MAIN_PAGE + url

const registerFirstUser = async t => {
  await t.navigateTo(getRootBasedUrl('/login'))
  await t.typeText(await Selector('input[name="username"]'), 'User 1')
  await t.typeText(await Selector('input[name="password"]'), 'User Password 1')
  await t.click(await Selector('.btn-success'))

  await t.wait(5000)

  // eslint-disable-next-line no-restricted-globals
  await t.eval(() => location.reload(true))
}

const loginFirstUser = async t => {
  await t.navigateTo(getRootBasedUrl('/login'))
  await t.typeText(await Selector('input[name="username"]'), 'User 1')
  await t.typeText(await Selector('input[name="password"]'), 'User Password 1')
  await t.click(await Selector('.btn-primary'))

  await t.wait(1000)
}

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Shopping Lists`

test('should list be empty', async t => {
  await registerFirstUser(t)

  await t.expect(await Selector('.shopping-list').count).eql(1)
})

test('create first shopping list', async t => {
  await loginFirstUser(t)

  await t.typeText(
    await Selector('.example-form-control'),
    'First Shopping List'
  )
  await t.click(await Selector('button').withText('Add Shopping List'))

  await t.expect(await Selector('.shopping-list').count).eql(2)
})

test('create second shopping list', async t => {
  await loginFirstUser(t)

  await t.typeText(
    await Selector('.example-form-control'),
    'Second Shopping List'
  )
  await t.click(await Selector('button').withText('Add Shopping List'))

  await t.expect(await Selector('.shopping-list').count).eql(3)
})

test('create items in first shopping list', async t => {
  await loginFirstUser(t)

  await t.click(Selector('a').withText('First Shopping List'))

  await t.wait(3000)

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

test('toggle items in first shopping list', async t => {
  await loginFirstUser(t)

  await t.click(Selector('a').withText('First Shopping List'))

  await t.wait(3000)

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

test('remove items in first shopping list', async t => {
  await loginFirstUser(t)

  await t.click(Selector('a').withText('First Shopping List'))

  await t.wait(3000)

  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))

  await t.expect(await Selector('.shopping-item').count).eql(0)
})
