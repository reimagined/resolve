import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const userId = nanoid()
const targetUrl = `${getTargetURL()}/hoc/view-model-isolation/${userId}`

fixture`HOC: view model isolation`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('register user', async (t) => {
  await t.click(Selector('button').withText('Register'))
  await t.expect(Selector('#likes-1').innerText).eql('0')
  await t.expect(Selector('#likes-2').innerText).eql('0')
})

test('like user', async (t) => {
  await t.click(Selector('button').withText('Like'))
  await t.expect(Selector('#likes-1').innerText).eql('1')
  await t.expect(Selector('#likes-2').innerText).eql('1')
})

test('unmount one view model', async (t) => {
  await t.click(Selector('button').withText('Unmount'))
  await t.expect(Selector('#likes-1').innerText).eql('1')
  await t.expect(Selector('#likes-2').exists).notOk()
})
