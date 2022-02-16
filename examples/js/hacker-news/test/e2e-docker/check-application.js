import { ROOT_URL, login } from '../e2e/utils'
fixture`application check`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(`${ROOT_URL}/login`)
})
test(`login`, async (t) => {
  await login(t)
})
