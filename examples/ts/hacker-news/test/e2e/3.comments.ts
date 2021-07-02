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
fixture`Comments`.skip.beforeEach(async (t /*: TestController */) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
  await login(t)
})

test('create a story', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/submit`)

  await t.typeText(Selector('input[type=text]').nth(1), 'many comments', {
    paste: true,
  })
  await t.typeText('textarea', 'read model connector test', { paste: true })
  await t.click('button')

  await waitSelector(
    t,
    'HackerNews',
    Selector('a').withText('Ask HN: many comments')
  )

  await t.expect('ok').ok('this assertion will pass')
})

test('#1541: broken comments pagination', async (t /*: TestController */) => {
  const pushComment = async (text, textArea, button) => {
    await t.typeText(textarea, text, { paste: true })
    await t.click(button)
    await t.expect(await Selector('div').withText(text).exists).eql(true)
  }

  await t.navigateTo(`${ROOT_URL}/newest`)
  await waitSelector(
    t,
    'HackerNews',
    Selector('a').withText('Ask HN: many comments')
  )

  const titleLink = await Selector('a').withText('Ask HN: many comments')
  await t.expect(titleLink.exists).eql(true)
  await t.click(titleLink)

  await waitSelector(t, 'Comments', Selector('textarea').nth(-1))

  const textarea = await Selector('textarea').nth(-1)
  const button = await Selector('button').nth(-1)

  for (let i = 0; i <= 30; i++) {
    await pushComment(`pushed-comment#${i}`, textarea, button)
  }

  await t.navigateTo(`${ROOT_URL}/comments`)

  await t.expect(Selector('div').withText('pushed-comment#30').exists).eql(true)
  await t.click(Selector('a').withText('More'))
  await t.expect(Selector('div').withText('pushed-comment#0').exists).eql(true)
})
