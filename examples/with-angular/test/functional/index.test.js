import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Hello, world!`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('home page', async (t) => {
  await t
    .expect(Selector('h1').withText('ReSolve Angular Example').visible)
    .ok()
})
