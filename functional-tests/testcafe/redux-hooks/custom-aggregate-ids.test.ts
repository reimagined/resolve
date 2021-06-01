import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const runId = nanoid()
const targetUrl = `${getTargetURL()}/redux-hooks/custom-aggregate-ids/${runId}`

fixture`Redux Hooks: custom view model resolver`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('#1874: useReduxViewModel hook not working if resolver returned aggregate ids differs', async (t) => {
  await t.expect(Selector('#counter').innerText).eql('0')
  await t.click(Selector('button').withText('increase'))
  await t.expect(Selector('#counter').innerText).eql('1')
})
