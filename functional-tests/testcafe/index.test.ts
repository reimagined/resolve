import { Selector } from 'testcafe'
import { getTargetURL } from '../utils/utils'

const targetUrl = getTargetURL()

fixture`Functional tests app`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('home page', async (t) => {
  await t.expect(await Selector('h2').withText('Basic tests').exists).eql(true)
})

test('increase counter', async (t) => {
  const prevResult = await Selector('#counter').innerText

  await t.click(Selector('button').withText('+'))

  await t
    .expect(Selector('#counter').innerText)
    .eql((+prevResult + 1).toString())
})

test('decrease counter', async (t) => {
  const prevResult = await Selector('#counter').innerText

  await t.click(Selector('button').withText('-'))

  await t
    .expect(Selector('#counter').innerText)
    .eql((+prevResult - 1).toString())
})

test('multiple test counter', async (t) => {
  const prevResult = await Selector('#counter').innerText

  await t.click(Selector('button').withText('+'))
  await t.click(Selector('button').withText('+'))
  await t.click(Selector('button').withText('+'))
  await t.click(Selector('button').withText('+'))
  await t.click(Selector('button').withText('+'))

  await t.navigateTo(targetUrl)

  await t.click(Selector('button').withText('-'))
  await t.click(Selector('button').withText('-'))
  await t.click(Selector('button').withText('-'))
  await t.click(Selector('button').withText('-'))
  await t.click(Selector('button').withText('-'))

  await t.expect(Selector('#counter').innerText).eql(prevResult)
})
