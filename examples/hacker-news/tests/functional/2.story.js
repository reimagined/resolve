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

  await t.typeText(Selector('input[type=text]').nth(0), 'my ask')
  await t.typeText('textarea', 'my text')
  await t.click('button')

  await t.wait(5000) // TODO Fix reactivity

  await t.expect(await Selector('a').withText('my ask').exists).eql(true)

  await t.expect(await Selector('div').withText('my text').exists).eql(true)

  await t.expect(await Selector('a').withText('123').exists).eql(true)

  await t.expect(await Selector('div').withText(/0 points .+/).exists).eql(true)
})

test('add comment', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/newest`)

  const titleLink = await Selector('a').withText('Ask HN: my ask')

  await t.expect(titleLink.exists).eql(true)

  await t.click(titleLink)

  await t.typeText('textarea', 'first comment')
  await t.click('button')

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)
  // TODO: check comments page and parent link
})

test('add reply', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/newest`)

  await t.click(await Selector('a').withText('Ask HN: my ask'))
  await t.click(await Selector('a').withText('reply'))

  await t.expect(await Selector('div').withText('my text').exists).eql(false)

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)

  await t.typeText('textarea', 'first reply')
  await t.click('button')

  await t.wait(5000) // TODO Fix reactivity

  await t.expect(await Selector('div').withText('first reply').exists).eql(true)

  // TODO: check comments page and parent link
})
