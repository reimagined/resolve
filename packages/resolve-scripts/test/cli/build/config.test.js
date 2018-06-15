import path from 'path'

import exec from '../../exec'

test('resolve-scripts build --config=resolve.test.config.json', async () => {
  const json = await exec(
    `resolve-scripts build --config=${path.resolve(
      __dirname,
      '../../resolve.test.config.json'
    )}`
  )

  const { env, ...config } = require('../../resolve.test.config.json')

  expect(json).toMatchObject({
    ...config,
    ...env.production
  })
})

test('resolve-scripts build --config=NONEXISTENT_FILE (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --config=NONEXISTENT_FILE')
  ).rejects.not.toBeUndefined()
})
