import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL, getClient } from '../utils/utils'

const root = `${getTargetURL()}/hoc`
const client = getClient()

const registerUser = (userId: string) =>
  client.command({
    aggregateName: 'user',
    type: 'register',
    aggregateId: userId,
    payload: {
      name: 'John Doe',
    },
  })

fixture`HOC tests`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(root)
})

test('same view model mounted multiple times within page', async (t) => {
  const userId = nanoid()
  await registerUser(userId)

  await t.navigateTo(`${root}/twice-view-model-mount/${userId}`)
  await t
    .expect(Selector('h3').withText('likes#1:0').visible)
    .ok({ timeout: 10000 })
  await t
    .expect(Selector('h3').withText('likes#2:0').visible)
    .ok({ timeout: 10000 })

  await t.click(Selector('button').withText('like'))

  await t
    .expect(Selector('h3').withText('likes#1:1').visible)
    .ok({ timeout: 10000 })
  await t
    .expect(Selector('h3').withText('likes#2:1').visible)
    .ok({ timeout: 10000 })
})
