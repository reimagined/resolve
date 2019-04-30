import { Selector } from 'testcafe'

const HOST = process.env.HOST || 'localhost'
export const ROOT_URL = `http://${HOST}:3000`

export const login = async (t /*: TestController */) => {
  await t.typeText(await Selector('input[type=text]').nth(1), '123')
  await t.click(await Selector('input[type=submit]').nth(0))
}
