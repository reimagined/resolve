import path from 'path'

import exec from '../../exec'

test('Inline env vars in a string works correctly', async () => {
  const json = await exec(
    `resolve-scripts dev --config=${path.resolve(
      __dirname,
      '../../resolve.test.env.config.json'
    )}`,
    {
      PORT: 1234,
      HOST: 'resolve.resolve',
      STORAGE_ADAPTER: 'memory',
      STORAGE_OPTIONS: JSON.stringify({ a: 5, b: 'xyz' })
    }
  )

  expect(json).toMatchObject({
    port: 1234,
    host: 'resolve.resolve',
    storage: {
      adapter: 'resolve-memory',
      options: { a: 5, b: 'xyz' }
    }
  })
})
