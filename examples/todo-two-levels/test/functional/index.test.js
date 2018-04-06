import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`

let todoListId, firstListId, secondListId

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Two Level Todo`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${MAIN_PAGE}${todoListId ? `/${todoListId}` : ''}`)
})

test('should add first list', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(0)

  await t.typeText(await Selector('input[type=text]'), 'List 1')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(0)
        .find('a').innerText
    )
    .eql('List 1')

  await t.expect(await Selector('ol').find('li').count).eql(1)

  firstListId = (await Selector('ol')
    .find('li')
    .nth(0)
    .find('a').attributes).href.slice(1)
})

test('should add second list', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(1)

  await t.typeText(await Selector('input[type=text]'), 'List 2')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(1)
        .find('a').innerText
    )
    .eql('List 2')

  await t.expect(await Selector('ol').find('li').count).eql(2)

  secondListId = (await Selector('ol')
    .find('li')
    .nth(1)
    .find('a').attributes).href.slice(1)

  todoListId = firstListId
})

// First List
test('should list be empty', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(0)
})

test('should add first todo', async t => {
  await t.typeText(await Selector('input[type=text]'), 'Test 1')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(0)
        .find('label').innerText
    )
    .eql('Test 1')
})

test('should add second todo', async t => {
  await t.typeText(await Selector('input[type=text]'), 'Test 2')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(1)
        .find('label').innerText
    )
    .eql('Test 2')
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
  await t.expect(await Selector('ol').find('li').count).eql(2)

  await t.click(
    await Selector('span')
      .withText('[x]')
      .nth(0)
  )

  await t.expect(await Selector('ol').find('li').count).eql(1)
})

test('should remove second todo', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(1)

  await t.click(
    await Selector('span')
      .withText('[x]')
      .nth(0)
  )

  await t.expect(await Selector('ol').find('li').count).eql(0)

  todoListId = secondListId
})

// Second List
test('should list be empty', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(0)
})

test('should add first todo', async t => {
  await t.typeText(await Selector('input[type=text]'), 'Test 1')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(0)
        .find('label').innerText
    )
    .eql('Test 1')
})

test('should add second todo', async t => {
  await t.typeText(await Selector('input[type=text]'), 'Test 2')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(1)
        .find('label').innerText
    )
    .eql('Test 2')
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
  await t.expect(await Selector('ol').find('li').count).eql(2)

  await t.click(
    await Selector('span')
      .withText('[x]')
      .nth(0)
  )

  await t.expect(await Selector('ol').find('li').count).eql(1)
})

test('should remove second todo', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(1)

  await t.click(
    await Selector('span')
      .withText('[x]')
      .nth(0)
  )

  await t.expect(await Selector('ol').find('li').count).eql(0)

  todoListId = null
})

test('should remove first list', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(2)

  await t.click(
    await Selector('span')
      .withText('[x]')
      .nth(0)
  )

  await t.expect(await Selector('ol').find('li').count).eql(1)
})

test('should remove second list', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(1)

  await t.click(
    await Selector('span')
      .withText('[x]')
      .nth(0)
  )

  await t.expect(await Selector('ol').find('li').count).eql(0)
})
