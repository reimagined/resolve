import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const channelId = nanoid()
const targetUrl = `${getTargetURL()}/read-model-channel/${channelId}`

fixture`React Hooks: read model channel`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('reactive echo round trip', async (t) => {
  const button = Selector('button').withText('publish')

  await t.click(button)
  await t.expect(Selector('#echo').innerText).eql('Reactive Hello!')
})
