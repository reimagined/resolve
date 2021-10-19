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
fixture`Story`.beforeEach(async (t /*: TestController */) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
  await login(t)
})

test('create', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/submit`)

  await t.typeText(Selector('input[type=text]').nth(1), 'my ask', {
    paste: true,
  })
  await t.typeText('textarea', 'my text', { paste: true })
  await t.click('button')

  await waitSelector(t, 'HackerNews', Selector('a').withText('Ask HN: my ask'))

  await t.expect('ok').ok('this assertion will pass')
})

test('add comment', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/newest`)

  await waitSelector(t, 'HackerNews', Selector('a').withText('Ask HN: my ask'))

  const titleLink = await Selector('a').withText('Ask HN: my ask')

  await t.expect(titleLink.exists).eql(true)

  await t.click(titleLink)

  await waitSelector(t, 'Comments', Selector('textarea').nth(-1))

  const textarea = await Selector('textarea').nth(-1)
  await t.typeText(textarea, 'first comment', { paste: true })

  const button = await Selector('button').nth(-1)
  await t.click(button)

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)
})

test('add reply', async (t /*: TestController */) => {
  await t.navigateTo(`${ROOT_URL}/newest`)

  await t.click(await Selector('a').withText('Ask HN: my ask').nth(-1))

  await waitSelector(t, 'Comments', Selector('a').withText('reply').nth(-1))

  await t.click(await Selector('a').withText('reply').nth(-1))

  await waitSelector(t, 'Comments', Selector('textarea').nth(-1))

  await t.expect(await Selector('div').withText('my text').exists).eql(false)

  await t
    .expect(await Selector('div').withText('first comment').exists)
    .eql(true)

  const textarea = await Selector('textarea').nth(-1)
  await t.typeText(textarea, 'first reply', { paste: true })

  const button = await Selector('button').nth(-1)
  await t.click(button)

  await waitSelector(t, 'Comments', Selector('div').withText('first reply'))

  await t.expect(await Selector('div').withText('first reply').exists).eql(true)
})

test('create with external link', async (t) => {
  await t.navigateTo(`${ROOT_URL}/submit`)

  await t.typeText(Selector('input[type=text]').nth(1), 'external link', {
    paste: true,
  })
  await t.typeText(
    Selector('input[type=text]').nth(2),
    'https://www.youtube.com',
    {
      paste: true,
    }
  )
  await t.typeText('textarea', 'my text', { paste: true })
  await t.click('button')

  await waitSelector(t, 'HackerNews', Selector('a').withText('external link'))
})

test('#1921: upvote/unvote story', async (t) => {
  await t.navigateTo(`${ROOT_URL}/submit`)

  await t.typeText(Selector('input[type=text]').nth(1), 'my ask', {
    paste: true,
  })
  await t.typeText('textarea', 'my text', { paste: true })
  await t.click('button')

  await waitSelector(t, 'HackerNews', Selector('a').withText('Ask HN: my ask'))

  await t.click(Selector('div').withAttribute('title', 'upvote'))

  await t.expect(await Selector('span').withText('1 point(s)').exists).eql(true)
  await t
    .expect(await Selector('div').withAttribute('title', 'upvote').exists)
    .eql(false)

  await t.click(Selector('span').withText('unvote'))

  await t.expect(await Selector('span').withText('0 point(s)').exists).eql(true)
  await t
    .expect(await Selector('div').withAttribute('title', 'upvote').exists)
    .eql(true)
})

test('#1928: stories pagination', async (t) => {
  for (let i = 0; i < 25; i++) {
    await t.navigateTo(`${ROOT_URL}/submit`)

    await t.typeText(Selector('input[type=text]').nth(1), `Story #${i + 1}`, {
      paste: true,
    })
    await t.typeText('textarea', `Story #${i + 1} text`, { paste: true })
    await t.click('button')

    await waitSelector(
      t,
      'HackerNews',
      Selector('a').withText(`Ask HN: Story #${i + 1}`)
    )
  }
  await t.navigateTo(`${ROOT_URL}/newest`)
  await t.expect(Selector('div').withText('Ask HN: Story #24').exists).eql(true)
  await t.click(Selector('a').withText('More'))
  await t
    .expect(Selector('div').withText('Ask HN: Story #24').exists)
    .eql(false)
  await t.expect(Selector('div').withText('Ask HN: Story #3').exists).eql(true)
  await t.click(Selector('a').withText('Prev'))
  await t.expect(Selector('div').withText('Ask HN: Story #24').exists).eql(true)
  await t.expect(Selector('div').withText('Ask HN: Story #3').exists).eql(false)
})
