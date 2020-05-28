import { Selector } from 'testcafe'
import { ReactSelector } from 'testcafe-react-selectors'
// import fetch from 'isomorphic-fetch'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

const generateUser = id => ({
  nickname: `user-nickname-${id}`,
  firstName: `user-name-${id}`,
  lastName: `user-lastName-${id}`,
  phoneNumber: `555-1234-${id}`,
  address: `User address-${id}`
})

const generatePost = id => ({
  title: `post-title-${id}`,
  content: `post-content-${id}`
})

const userRegistration = async (t, user) => {
  const { nickname, firstName, lastName, phoneNumber, address } = user
  const registrationForm = ReactSelector('RegistrationForm')
  await t.typeText(registrationForm.find('#nickname'), nickname)
  await t.typeText(registrationForm.find('#firstName'), firstName)
  await t.typeText(registrationForm.find('#lastName'), lastName)
  await t.typeText(registrationForm.find('#phoneNumber'), phoneNumber)
  await t.typeText(registrationForm.find('#address'), address)
  await t.click(registrationForm.find('button').withText('Sign Up'))
}

const publishPost = async (t, post) => {
  const { title, content } = post
  const newPostButton = ReactSelector('button').withText('Publish new post')
  await t.click(newPostButton)
  await t.typeText(Selector('#addPostTitle'), title)
  await t.typeText(Selector('#addPostContent'), content)
  const publishPostButton = ReactSelector('button').withText('Publish')
  await t.click(publishPostButton)
}

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`PersonalData`.beforeEach(async t => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('new user, first load', async t => {
  const registrationForm = ReactSelector('RegistrationForm')
  await t.expect(registrationForm.exists).ok()
})

test('new user, registration', async t => {
  await userRegistration(t, generateUser(1))
  const nicknameItem = ReactSelector('a').withText('user-nickname-1')
  await t.expect(nicknameItem.exists).ok()
})

test('registered user, posts creation', async t => {
  await userRegistration(t, generateUser(2))
  await publishPost(t, generatePost(1))
  await publishPost(t, generatePost(2))
  await publishPost(t, generatePost(3))
  const posts1 = ReactSelector('Post')
  await t.expect(posts1.count).eql(3)

  await t.navigateTo(MAIN_PAGE)

  const posts2 = ReactSelector('Post')
  await t.expect(posts2.count).eql(3)
})

test('registered user, posts deletion', async t => {
  await userRegistration(t, generateUser(2))
  await publishPost(t, generatePost(1))
  await publishPost(t, generatePost(2))
  await publishPost(t, generatePost(3))

  await t.navigateTo(MAIN_PAGE)

  const deleteButtons = ReactSelector('button').withText('Delete post')
  await t.click(deleteButtons.nth(2))
  await t.click(deleteButtons.nth(1))
  await t.click(deleteButtons.nth(0))

  await t.navigateTo(MAIN_PAGE)

  const posts2 = ReactSelector('Post')
  await t.expect(posts2.exists).notOk()
})

test.skip('registered user, profile update', async t => {
  await userRegistration(t, generateUser(3))

  await t.navigateTo(`${MAIN_PAGE}/profile`)

  const registrationForm = ReactSelector('RegistrationForm')
  await t.typeText(registrationForm.find('#firstName'), '-updated')
  await t.typeText(registrationForm.find('#lastName'), '-updated')
  await t.typeText(registrationForm.find('#phoneNumber'), '-updated')
  await t.typeText(registrationForm.find('#address'), '-updated')

  const updateButton = ReactSelector('button').withText('Update')
  await t.click(updateButton)

  await t.navigateTo(MAIN_PAGE)

  const fullName = Selector('p').withText(
    `user-name-3-updated user-lastName-3-updated`
  )

  await t.expect(fullName.exists).ok()
})

test('registered user, gather personal data', async t => {
  await userRegistration(t, generateUser(4))

  let nicknameItem = ReactSelector('a').withText('user-nickname-4')
  await t.click(nicknameItem)

  const gatherItem = ReactSelector('button').withText('Gather my personal data')
  await t.click(gatherItem)

  const progressItem = ReactSelector('button').withText('Being gathered now...')
  await t.expect(progressItem.exists).ok()

  await t.wait(5000).navigateTo(MAIN_PAGE)

  nicknameItem = ReactSelector('a').withText('user-nickname-4')
  await t.click(nicknameItem)

  const downloadItem = ReactSelector('a').withText('Download')
  await t.expect(downloadItem.exists).ok()
})

test('registered user, profile removal', async t => {
  await userRegistration(t, generateUser(5))

  const nicknameItem = ReactSelector('a').withText('user-nickname-5')
  await t.click(nicknameItem)

  const removeItem = ReactSelector('button').withText('Delete my profile')
  await t.click(removeItem)

  const registrationForm = ReactSelector('RegistrationForm')
  await t.expect(registrationForm.exists).ok()
})
