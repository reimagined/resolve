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
    .expect(
      await Selector('section').withText(
        'Hello World, this is my first styled component!'
      ).exists
    )
    .eql(true)
})
