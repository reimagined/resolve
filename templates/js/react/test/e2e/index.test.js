import { Selector } from 'testcafe'
const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`
// eslint-disable-next-line no-unused-expressions, no-undef
fixture`reSolve Application`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})
test('home page', async (t) => {
  await t
    .expect(await Selector('span').withText('reSolve React Template').exists)
    .eql(true)
})
