import { Selector } from 'testcafe'
import fetch from 'isomorphic-fetch'

import { ROOT_URL, login } from './utils'

const waitSelector = async (eventSubscriber, selector) => {
  while (true) {
    const res = await fetch(
      'http://localhost:3000/api/event-broker/read-models-list'
    )

    const comments = (await res.json()).find(
      readModel => readModel.eventSubscriber === eventSubscriber
    )

    if (comments.status !== 'deliver') {
      throw new Error(`Read-model status ${comments.status}`)
    }

    try {
      await selector
      break
    } catch (e) {}
  }
}

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

  await waitSelector('Comments', Selector('textarea').nth(-1))

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

  await waitSelector(
    'Comments',
    Selector('a')
      .withText('reply')
      .nth(-1)
  )

  await t.click(
    await Selector('a')
      .withText('reply')
      .nth(-1)
  )

  await waitSelector('Comments', Selector('textarea').nth(-1))

  await t.expect(await Selector('div').withText('my text').exists).eql(false)

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)

  const textarea = await Selector('textarea').nth(-1)
  await t.typeText(textarea, 'first reply')

  const button = await Selector('button').nth(-1)
  await t.click(button)

  await waitSelector('Comments', Selector('div').withText('first reply'))

  await t.expect(await Selector('div').withText('first reply').exists).eql(true)

  // TODO: check comments page and parent link
})
