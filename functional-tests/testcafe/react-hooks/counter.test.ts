import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const counterId = nanoid()
const targetUrl = `${getTargetURL()}/counter/${counterId}`

fixture`React Hooks: view model counter`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('increase counter', async (t) => {
  await t.click(Selector('button').withText('+'))
  await t.expect(Selector('#counter').innerText).eql('1')
})

test('decrease counter', async (t) => {
  await t.click(Selector('button').withText('-'))
  await t.expect(Selector('#counter').innerText).eql('0')
})

test('multiple test counter', async (t) => {
  await t.expect(Selector('#counter').innerText).eql('0')

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

  await t.expect(Selector('#counter').innerText).eql('0')
})
