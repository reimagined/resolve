import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Todo`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('should list be empty', async t => {
  await t.expect(await Selector('ul').find('li').count).eql(0)
})

test('should add first todo', async t => {
  await t.typeText(await Selector('input[type=text]'), 'Test 1')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ul')
        .find('li')
        .nth(0)
        .find('label').innerText
    )
    .eql('Test 1')
})

test('should add second todo without text', async t => {
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ul')
        .find('li')
        .nth(1)
        .find('label').innerText
    )
    .eql('New Task')
})

test('should toggle first todo', async t => {
  await t
    .expect(await Selector('input[type=checkbox]').nth(0).checked)
    .eql(false)

  await t.click(await Selector('input[type=checkbox]').nth(0))

  await t
    .expect(await Selector('input[type=checkbox]').nth(0).checked)
    .eql(true)
})

test('should remove first todo', async t => {
  await t.expect(await Selector('ul').find('li').count).eql(2)

  await t.click(await Selector('.example-close-button').nth(0))

  await t.expect(await Selector('ul').find('li').count).eql(1)
})

test('should remove second todo', async t => {
  await t.expect(await Selector('ul').find('li').count).eql(1)

  await t.click(await Selector('.example-close-button').nth(0))

  await t.expect(await Selector('ul').find('li').count).eql(0)
})
