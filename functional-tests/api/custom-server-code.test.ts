import { getTargetURL } from '../utils/utils'

test('ensure custom server code chunk executed', async () => {
  const response = await fetch(`${getTargetURL()}/api/exec-custom-server-code`)

  const result = await response.json()

  expect(result).toEqual(`custom server code response: test-value`)
})
