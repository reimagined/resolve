import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const targetUrl = `${getTargetURL()}/secrets-manager`

fixture`React Hooks: secrets manager`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('assert secrets manager is available within resolver', async (t) => {
  const button = Selector('button').withText('assert')

  await t.click(button)
  await t.expect(Selector('#secret-value').innerText).eql('secret-value')
})
