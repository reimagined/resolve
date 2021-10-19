import { Selector } from 'testcafe'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '3000'
const MAIN_PAGE = `http://${host}:${port}`

const userName = Selector('.userName')
const newMessage = Selector('.newMessage')
const chatMessageUser = Selector('.currentMessageUsername')
const chatMessageText = Selector('.currentMessageText')

// eslint-disable-next-line no-unused-expressions, no-undef
fixture`Hello, world!`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(MAIN_PAGE)
})

test('chat', async (t) => {
  await t.typeText(userName, 'John Doe', { paste: true })
  await t.typeText(newMessage, 'Hello!', { paste: true })
  await t.pressKey('enter')
  await t.expect(chatMessageUser.withText('John Doe').nth(0).visible).ok()
  await t.expect(chatMessageText.withText('Hello!').visible).ok()

  await t.typeText(userName, 'Jane Doe', { paste: true })
  await t.typeText(newMessage, 'Greetings!', { paste: true })
  await t.pressKey('enter')
  await t.expect(chatMessageUser.withText('Jane Doe').nth(0).visible).ok()
  await t.expect(chatMessageText.withText('Greetings!').visible).ok()

  await t.typeText(userName, 'John Doe', { paste: true })
  await t.typeText(newMessage, 'How are you?', { paste: true })
  await t.pressKey('enter')
  await t.expect(chatMessageUser.withText('John Doe').nth(1).visible).ok()
  await t.expect(chatMessageText.withText('How are you?').visible).ok()

  await t.typeText(userName, 'Jane Doe', { paste: true })
  await t.typeText(newMessage, 'Fine!', { paste: true })
  await t.pressKey('enter')
  await t.expect(chatMessageUser.withText('Jane Doe').nth(1).visible).ok()
  await t.expect(chatMessageText.withText('Fine!').visible).ok()
})
