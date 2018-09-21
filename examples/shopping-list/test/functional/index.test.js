import { Selector, ClientFunction } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`

const getPageBody = ClientFunction(function() {
  return window.document.body.innerText
})

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Todo`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('empty list', async t => {
  await t.expect(await Selector('td > a').count).eql(0)
})

test('create first shopping list', async t => {
  await t.typeText(Selector('input[type=text]').nth(0), 'First Shopping List')
  await t.click(Selector('button').withText('Add Shopping List'))

  await t.expect(await Selector('td > a').count).eql(1)
})

test('create second shopping list', async t => {
  await t.typeText(Selector('input[type=text]').nth(0), 'Second Shopping List')
  await t.click(Selector('button').withText('Add Shopping List'))

  await t.expect(await Selector('td > a').count).eql(2)
})

test('get list json from /api/shopping-lists.json', async t => {
  await t.navigateTo('/api/shopping-lists.json')

  await t.expect(getPageBody()).contains('First Shopping List')
  await t.expect(getPageBody()).contains('Second Shopping List')
})

test('create items in first shopping list', async t => {
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
  await t.click(Selector('a').withText('First Shopping List'))

  await t.wait(3000)

  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))

  await t.expect(await Selector('td > a').count).eql(0)
})

test('create items in second shopping list', async t => {
  await t.click(Selector('a').withText('Second Shopping List'))

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

test('toggle items in second shopping list', async t => {
  await t.click(Selector('a').withText('Second Shopping List'))

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

test('remove items in second shopping list', async t => {
  await t.click(Selector('a').withText('Second Shopping List'))

  await t.wait(3000)

  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))
  await t.click(Selector('.example-close-button'))

  await t.expect(await Selector('td > a').count).eql(0)
})

test('remove shopping lists', async t => {
  await t.click(Selector('.btn.btn-default'))
  await t.click(Selector('.btn.btn-default'))

  await t.expect(await Selector('td > a').count).eql(0)
})

test('get list json from /api/shopping-lists.json', async t => {
  await t.navigateTo('/api/shopping-lists.json')

  await t.expect(getPageBody()).notContains('First Shopping List')
  await t.expect(getPageBody()).notContains('Second Shopping List')
})
