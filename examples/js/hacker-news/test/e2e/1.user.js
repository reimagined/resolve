import { Selector } from 'testcafe'
import fetch from 'isomorphic-fetch'
import { ROOT_URL, login } from './utils'
const waitSelector = async (t, eventSubscriber, selector) => {
  while (true) {
    const res = await fetch(`${ROOT_URL}/api/event-broker/read-models-list`)
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
// eslint-disable-next-line
fixture`User`.beforeEach(async (t /*: TestController */) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
})
test('create', async (t) => {
  await t.expect(await Selector('a').withText('login').exists).eql(true)
  await t.typeText(await Selector('input[type=text]').nth(2), '123', {
    paste: true,
  })
  await t.click(await Selector('input[type=submit]').nth(1))
  await waitSelector(t, 'HackerNews', Selector('a').withText('123'))
  await t.expect(await Selector('a').withText('123').exists).eql(true)
  await t.expect(await Selector('a').withText('logout').exists).eql(true)
  await t.expect(await Selector('a').withText('login').exists).eql(false)
})
test('login', async (t /*: TestController */) => {
  await t.expect(await Selector('a').withText('login').exists).eql(true)
  await login(t)
  await waitSelector(t, 'HackerNews', Selector('a').withText('123'))
  await t.expect(await Selector('a').withText('123').exists).eql(true)
  await t.expect(await Selector('a').withText('logout').exists).eql(true)
  await t.expect(await Selector('a').withText('login').exists).eql(false)
})
test('create: User cannot be created', async (t /*: TestController */) => {
  await t.typeText(await Selector('input[type=text]').nth(2), '123', {
    paste: true,
  })
  await t.click(await Selector('input[type=submit]').nth(1))
  await waitSelector(t, 'HackerNews', Selector('a').withText('login'))
  await t.expect(await Selector('a').withText('logout').exists).eql(false)
  await t.expect(await Selector('a').withText('login').exists).eql(true)
  await t.expect(await Selector('div').withText('Error').exists).eql(true)
  await t
    .expect(await Selector('div').withText('User cannot be created').exists)
    .eql(true)
})
