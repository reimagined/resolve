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
  await t.click(Selector('button').withText('Execute retry on error scenario'))
  await t
    .expect(
      Selector('button')
        .withText('Execute retry on error scenario')
        .sibling('div').innerText
    )
    .eql('TEST_SCENARIO_RETRY_ON_ERROR_COMPLETED')
})
