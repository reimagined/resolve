import { ROOT_URL, login } from '../e2e/utils'

fixture`application check`.beforeEach(async (t /*: TestController */) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
  await login(t)
})
