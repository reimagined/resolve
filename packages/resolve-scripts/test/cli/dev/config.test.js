import path from 'path'

import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts dev --config=resolve.test.config.json', async () => {
  const json = await exec(
    `resolve-scripts dev --config=${path.resolve(
      __dirname,
      '../../resolve.test.config.json'
    )}`
  )

  const { env, ...config } = require('../../resolve.test.config.json')

  expect(json).toMatchObject({
    ...config,
    ...env.development
  })
})

test('resolve-scripts dev --config=NONEXISTENT_FILE (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts dev --config=NONEXISTENT_FILE')
  ).rejects.not.toBeUndefined()
})
