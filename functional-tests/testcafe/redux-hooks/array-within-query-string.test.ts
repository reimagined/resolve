import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const runId = nanoid()
const targetUrl = `${getTargetURL()}/redux-hooks/array-within-query-string/${runId}`

fixture`Redux Hooks: named selectors`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('create scenarios', async (t) => {
  await t.click(Selector('button').withText('make scenario 0'))
  await t.click(Selector('button').withText('make scenario 1'))
  await t.click(Selector('button').withText('make scenario 2'))
})

test('query string array with "none" option', async (t) => {
  await t.click(
    Selector('button').withText('retrieve all with query string none')
  )
  await t.expect(Selector('#scenarios-none').innerText).eql('3-3')
})

test('default query string options', async (t) => {
  await t.click(Selector('button').withText('retrieve all with defaults'))
  await t.expect(Selector('#scenarios-default').innerText).eql('3-3')
})
