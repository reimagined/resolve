import { Selector } from 'testcafe'
import { ReactSelector } from 'testcafe-react-selectors'
import fetch from 'isomorphic-fetch'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

const generateUser = (id) => ({
  nickname: `user-nickname-${id}`,
  firstName: `user-name-${id}`,
  lastName: `user-lastName-${id}`,
  phoneNumber: `555-1234-${id}`,
  address: `User address-${id}`,
})

const generatePost = (id) => ({
  title: `post-title-${id}`,
  content: `post-content-${id}`,
})

const refreshAndWait = async (t, eventSubscriber, selector, expectedValue) => {
  while (true) {
    const res = await fetch(`${MAIN_PAGE}/api/event-broker/read-models-list`)

    const readModel = (await res.json()).find(
      (readModel) => readModel.eventSubscriber === eventSubscriber
    )

    if (readModel.status !== 'deliver') {
      throw new Error(`Test failed. Read-model status "${readModel.status}"`)
    }

    await t.navigateTo(MAIN_PAGE)

    try {
      await t.expect(await selector()).eql(expectedValue)
      break
    } catch (e) {
      await t.wait(1000)
    }
  }
}

const userRegistration = async (t, user) => {
  const { nickname, firstName, lastName, phoneNumber, address } = user
  const registrationForm = ReactSelector('RegistrationForm')
  await t.typeText(registrationForm.find('#nickname'), nickname, {
    paste: true,
  })
  await t.typeText(registrationForm.find('#firstName'), firstName, {
    paste: true,
  })
  await t.typeText(registrationForm.find('#lastName'), lastName, {
    paste: true,
  })
  await t.typeText(registrationForm.find('#phoneNumber'), phoneNumber, {
    paste: true,
  })
  await t.typeText(registrationForm.find('#address'), address, { paste: true })
  await t.click(registrationForm.find('#consent'))
  await t.click(registrationForm.find('button').withText('Sign Up'))
  await refreshAndWait(
    t,
    'user-profiles',
    () => ReactSelector('a').withText(nickname).exists,
    true
  )
}

const publishPost = async (t, post) => {
  const { title, content } = post
  const newPostButton = ReactSelector('button').withText('Publish new post')
  await t.click(newPostButton)
  await t.typeText(Selector('#addPostTitle'), title, { paste: true })
  await t.typeText(Selector('#addPostContent'), content, { paste: true })
  const publishPostButton = ReactSelector('button').withText('Publish')
  await t.click(publishPostButton)
}

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`PersonalData`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('new user, first load', async (t) => {
  const registrationForm = ReactSelector('RegistrationForm')
  await t.expect(registrationForm.exists).ok()
})

test('new user, registration', async (t) => {
  await userRegistration(t, generateUser(1))
  const nicknameItem = ReactSelector('a').withText('user-nickname-1')
  await refreshAndWait(t, 'user-profiles', () => nicknameItem.exists, true)
  await t.expect(nicknameItem.exists).ok()
})

test('registered user, posts creation', async (t) => {
  await userRegistration(t, generateUser(2))
  await publishPost(t, generatePost(1))
  await publishPost(t, generatePost(2))
  await publishPost(t, generatePost(3))
  const posts1 = ReactSelector('Post')
  await t.expect(posts1.count).eql(3)

  await t.navigateTo(MAIN_PAGE)

  const posts2 = ReactSelector('Post')
  await refreshAndWait(t, 'blog-posts', () => posts2.count, 3)
  await t.expect(posts2.count).eql(3)
})

test('registered user, posts deletion', async (t) => {
  await userRegistration(t, generateUser(3))
  await publishPost(t, generatePost(1))
  await publishPost(t, generatePost(2))
  await publishPost(t, generatePost(3))

  await t.navigateTo(MAIN_PAGE)

  const deleteButtons = ReactSelector('button').withText('Delete post')
  await refreshAndWait(t, 'blog-posts', () => deleteButtons.count, 3)
  await t.click(deleteButtons.nth(2))
  await t.click(deleteButtons.nth(1))
  await t.click(deleteButtons.nth(0))

  await t.navigateTo(MAIN_PAGE)

  const posts2 = ReactSelector('Post')
  await refreshAndWait(t, 'blog-posts', () => posts2.count, 0)
  await t.expect(posts2.exists).notOk()
})

test('registered user, profile update', async (t) => {
  await userRegistration(t, generateUser(4))

  await t.navigateTo(`${MAIN_PAGE}/profile`)

  const registrationForm = ReactSelector('RegistrationForm')
  await t.typeText(registrationForm.find('#firstName'), '-updated', {
    paste: true,
  })
  await t.typeText(registrationForm.find('#lastName'), '-updated', {
    paste: true,
  })
  await t.typeText(registrationForm.find('#phoneNumber'), '-updated', {
    paste: true,
  })
  await t.typeText(registrationForm.find('#address'), '-updated', {
    paste: true,
  })

  const updateButton = ReactSelector('button').withText('Update')
  await t.click(updateButton)

  await t.navigateTo(MAIN_PAGE)

  const fullName = Selector('p').withText(
    `user-name-4-updated user-lastName-4-updated`
  )

  await refreshAndWait(t, 'user-profiles', () => fullName.exists, true)
  await t.expect(fullName.exists).ok()
})

test('registered user, gather personal data', async (t) => {
  await userRegistration(t, generateUser(5))

  let nicknameItem = ReactSelector('a').withText('user-nickname-5')
  await t.click(nicknameItem)

  const gatherItem = ReactSelector('button').withText('Gather my personal data')
  await t.click(gatherItem)

  const progressItem = ReactSelector('button').withText('Being gathered now...')
  await t.expect(progressItem.exists).ok()

  await t.wait(10000).navigateTo(MAIN_PAGE)

  nicknameItem = ReactSelector('a').withText('user-nickname-5')
  await t.click(nicknameItem)

  const downloadItem = ReactSelector('a').withText('Download')
  await t.expect(downloadItem.exists).ok()
})

test('registered user, profile removal', async (t) => {
  await userRegistration(t, generateUser(6))

  const nicknameItem = ReactSelector('a').withText('user-nickname-6')
  await t.click(nicknameItem)

  const removeItem = ReactSelector('button').withText('Delete my profile')
  await t.click(removeItem)

  const registrationForm = ReactSelector('RegistrationForm')
  await t.expect(registrationForm.exists).ok({ timeout: 15000 })
})
