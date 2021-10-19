import { Selector } from 'testcafe'
const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || '3000'
export const ROOT_URL = `http://${HOST}:${PORT}`
export const login = async (t /*: TestController */) => {
  await t.typeText(await Selector('input[type=text]').nth(1), '123', {
    paste: true,
  })
  await t.click(await Selector('input[type=submit]').nth(0))
}
