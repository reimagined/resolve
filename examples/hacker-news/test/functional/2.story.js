import { Selector } from 'testcafe'

import { ROOT_URL, login } from './utils'

// eslint-disable-next-line
fixture`Story`.beforeEach(async (t /*: TestController */) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
  await login(t)
})

test('create', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/submit`)

  await t.typeText(Selector('input[type=text]').nth(1), 'my ask')
  await t.typeText('textarea', 'my text')
  await t.click('button')

  await t.expect('ok').ok('this assertion will pass')
})

test('add comment', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/newest`)

  const titleLink = await Selector('a').withText('Ask HN: my ask')

  await t.expect(titleLink.exists).eql(true)

  await t.click(titleLink)

  await t.wait(5000) // TODO Fix reactivity

  const textarea = await Selector('textarea').nth(-1)
  await t.typeText(textarea, 'first comment')

  const button = await Selector('button').nth(-1)
  await t.click(button)

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)
  // TODO: check comments page and parent link
})

test('add reply', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/newest`)

  await t.click(
    await Selector('a')
      .withText('Ask HN: my ask')
      .nth(-1)
  )

  await t.wait(5000) // TODO Fix reactivity

  await t.click(
    await Selector('a')
      .withText('reply')
      .nth(-1)
  )

  await t.wait(5000) // TODO Fix reactivity

  await t.expect(await Selector('div').withText('my text').exists).eql(false)

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)

  const textarea = await Selector('textarea').nth(-1)
  await t.typeText(textarea, 'first reply')

  const button = await Selector('button').nth(-1)
  await t.click(button)

  await t.wait(5000) // TODO Fix reactivity

  await t.expect(await Selector('div').withText('first reply').exists).eql(true)

  // TODO: check comments page and parent link
})
