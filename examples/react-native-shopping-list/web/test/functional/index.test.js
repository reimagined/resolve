import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Todo`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('should list be empty', async t => {
  await t.expect(await Selector('a').count).eql(0)
})
