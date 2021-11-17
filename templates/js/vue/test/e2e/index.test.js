import { Selector } from 'testcafe'
const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`
// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Hello, world!`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})
test('static assets are resolved', async (t) => {
  await t
    .expect(
      Selector('.nav-link').child('img[src="/static/resolve-logo.png"]').visible
    )
    .ok()
  await t
    .expect(
      Selector('.nav-link').child('img[src="/static/twitter-logo.png"]').visible
    )
    .ok()
  await t
    .expect(Selector('head > link[href="/static/bootstrap.css"]').exists)
    .ok()
  await t
    .expect(Selector('head > link[href="/static/bootstrap-vue.css"]').exists)
    .ok()
})
