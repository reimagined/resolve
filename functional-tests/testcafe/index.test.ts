import { Selector } from 'testcafe'
import { getTargetURL } from '../utils/utils'

const targetUrl = getTargetURL()

fixture`Functional tests app`.skip.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('home page', async (t) => {
  await t.expect(await Selector('h2').withText('Basic tests').exists).eql(true)
})
