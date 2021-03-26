import { Selector } from 'testcafe'
import * as fetch from 'isomorphic-fetch'

import { getTargetURL } from '../../utils/utils'

const targetUrl = `${getTargetURL()}/file-uploader`

fixture`React Hooks: file uploader`.beforeEach(async (t) => {
  await t.setNativeDialogHandler(() => true)
  await t.navigateTo(targetUrl)
})

test('upload file', async (t) => {
  const button = Selector('button').withText('Upload image')

  await t.click(button)

  const uploadButton = Selector('button').withText('Upload')

  await t
    .setFilesToUpload('#fileUpload', '../../utils/test-file.png')
    .click(uploadButton)

  const fileLink = await Selector('#link').getAttribute('href')

  const res = await fetch(fileLink)

  await t.expect(res.status).eql(200)
})
