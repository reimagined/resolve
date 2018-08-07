import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3006`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`with-saga`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('start page', async t => {
  await t
    .expect(await Selector('.example-no-data').withText('No users').exists)
    .eql(true)
})

test('create default', async t => {
  await t.click(await Selector('.example-button'))

  await t
    .expect(
      await Selector('.list-group-item-heading')
        .nth(0)
        .withText('example@example.com').exists
    )
    .eql(true)
})

test('get error on second default', async t => {
  await t.click(await Selector('.example-button'))

  await t
    .expect(
      await Selector('.example-alert').withText(
        "User with the 'example@example.com' email already exists"
      ).exists
    )
    .eql(true)
})

test('check one user after error', async t => {
  await t.click(await Selector('.example-button'))

  await t
    .expect(
      await Selector('.list-group-item-heading')
        .nth(1)
        .withText('example@example.com').exists
    )
    .eql(false)
})

test('create custom', async t => {
  await t.typeText(await Selector('input[type=email]'), 'custom@example.com')
  await t.click(await Selector('.example-button'))

  await t
    .expect(
      await Selector('.list-group-item-heading')
        .nth(0)
        .withText('custom@example.com').exists
    )
    .eql(true)
})

test('check no error', async t => {
  await t
    .expect(
      await Selector('.example-alert').withText(
        "User with the 'custom@example.com' email already exists"
      ).exists
    )
    .eql(false)
})

test('get error on second custom', async t => {
  await t.typeText(await Selector('input[type=email]'), 'custom@example.com')
  await t.click(await Selector('.example-button'))

  await t
    .expect(
      await Selector('.example-alert').withText(
        "User with the 'custom@example.com' email already exists"
      ).exists
    )
    .eql(true)
})

test('check two users after error', async t => {
  await t.click(await Selector('.example-button'))

  await t
    .expect(
      await Selector('.list-group-item-heading')
        .nth(1)
        .withText('custom@example.com').exists
    )
    .eql(false)
})
