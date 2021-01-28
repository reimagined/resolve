import { nanoid } from 'nanoid'
import { Selector } from 'testcafe'
import { getTargetURL } from '../../utils/utils'

const scenarioId = nanoid()
const targetUrl = `${getTargetURL()}/client-middleware/${scenarioId}`

fixture`React Hooks: client middleware`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('retry on error middleware and bad command', async (t) => {
  const button = Selector('button').withText('Retry on error: useCommand')

  await t.click(button)
  await t
    .expect(button.sibling('div').innerText)
    .eql('TEST_SCENARIO_RETRY_ON_ERROR_COMPLETED')
})
test('retry on error middleware and bad read model', async (t) => {
  const button = Selector('button').withText('Retry on error: useQuery')

  await t.click(button)
  await t.expect(button.sibling('div').innerText).eql('test ok')
})
test('retry on error middleware and bad view model', async (t) => {
  const button = Selector('button').withText('Retry on error: useViewModel')

  await t.click(button)
  await t.expect(button.sibling('div').innerText).eql('test ok')
})
