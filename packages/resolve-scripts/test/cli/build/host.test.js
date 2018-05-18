import exec from '../../exec'

test('resolve-scripts build --start --host=http://test.test', async () => {
  const json = await exec(
    'resolve-scripts build --start --host=http://test.test'
  )

  expect(json).toHaveProperty('start', true)
  expect(json).toHaveProperty('host', 'http://test.test')
})

test('resolve-scripts build --host=http://test.test (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --host=http://test.test')
  ).rejects.toThrow()
})
