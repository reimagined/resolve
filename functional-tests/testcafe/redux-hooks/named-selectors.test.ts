import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const userId = nanoid()
const targetUrl = `${getTargetURL()}/redux-hooks/named-selectors/${userId}`

fixture`Redux Hooks: named selectors`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('initial view model redux state', async (t) => {
  await t.expect(Selector('#likeCounter').innerText).eql('-999')
})

test('initial read model redux state', async (t) => {
  await t.expect(Selector('#userName').innerText).eql('unknown user')
})

test('register user and receive view model update', async (t) => {
  await t.click(Selector('button').withText('Register'))
  await t.expect(Selector('#likeCounter').innerText).eql('0')
})

test('like the user', async (t) => {
  await t.click(Selector('button').withText('Like'))
  await t.expect(Selector('#likeCounter').innerText).eql('1')
})

test('request user profile', async (t) => {
  await t.click(Selector('button').withText('Profile'))
  await t.expect(Selector('#userName').innerText).eql('John Smith')
})
