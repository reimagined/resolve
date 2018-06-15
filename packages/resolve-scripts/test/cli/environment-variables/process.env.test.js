import path from 'path'

import exec from '../../exec'

jest.setTimeout(30000);

test('process.env.XXX works correctly', async () => {
  const json = await exec(
    `resolve-scripts dev --config=${path.resolve(
      __dirname,
      './resolve.test.env.process.env.config.json'
    )}`
  )

  expect(json).toMatchSnapshot()
})
