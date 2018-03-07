import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const MAIN_PAGE = `http://${host}:3000`

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`News`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('should be reactive', async t => {
  await t.expect(await Selector('ol').find('li').count).eql(0)

  await t.typeText(await Selector('input[type=text]'), 'List 1')
  await t.click(await Selector('button'))

  await t
    .expect(
      await Selector('ol')
        .find('li')
        .nth(0)
        .find('a').innerText
    )
    .eql('List 1')

  await t.expect(await Selector('ol').find('li').count).eql(1)

  firstListId = (await Selector('ol')
    .find('li')
    .nth(0)
    .find('a').attributes).href.slice(1)
})
