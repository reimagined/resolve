import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const runId = nanoid()
const targetUrl = `${getTargetURL()}/redux-hooks/view-model/${runId}`

fixture`Redux Hooks: basic view model tests`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('#1715: "eventReceived" action creator never called', async (t) => {
  await t.expect(Selector('#byEvents').innerText).eql('0')
  await t.expect(Selector('#byState').innerText).eql('0')

  await t.click(Selector('button').withText('Increase'))

  await t.expect(Selector('#byEvents').innerText).eql('1')
  await t.expect(Selector('#byState').innerText).eql('1')
})
