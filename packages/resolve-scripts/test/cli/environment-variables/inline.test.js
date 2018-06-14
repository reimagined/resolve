import path from 'path'

import exec from '../../exec'

test('Inline env vars in a string works correctly', async () => {
  const json = await exec(
    `resolve-scripts dev --config=${path.resolve(
      __dirname,
      './resolve.test.env.inline.config.json'
    )}`,
    {
      PORT: 1234,
      JWT_COOKIE_NAME: 'test-jwt',
      STORAGE_ADAPTER: 'memory',
      STORAGE_OPTIONS: JSON.stringify({ a: 5, b: 'xyz' })
    }
  )

  expect(json).toMatchObject({
    port: 1234,
    storageAdapter: {
      module: 'resolve-memory',
      options: { a: 5, b: 'xyz' }
    },
    jwtCookie: {
      name: 'test-jwt',
      maxAge: 123
    }
  })
})
