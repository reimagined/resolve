import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Before login`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('should be not logged in', async t => {
  await t
    .expect(await Selector('h1').withText('You are not logged in').exists)
    .eql(true)
})

test('should be a login', async t => {
  await t.typeText(await Selector('input[type=text]'), 'New Name')
  await t.click(await Selector('input[type=submit]'))

  await t
    .expect(await Selector('h1').withText('Hello, New Name').exists)
    .eql(true)
})

test('should be a logout', async t => {
  await t
    .expect(await Selector('h1').withText('You are not logged in').exists)
    .eql(true)
})
