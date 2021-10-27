import { Selector } from 'testcafe'
import { ROOT_URL, login } from '../e2e/utils'
// eslint-disable-next-line
fixture`imported data check`.beforeEach(async (t /*: TestController */) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
  await login(t)
})
test('wait entry', async (t /*: TestController */) => {
  await t
    .expect(Selector('a').withText('Ask HN: single comment').exists)
    .ok({ timeout: 20000 })
})
