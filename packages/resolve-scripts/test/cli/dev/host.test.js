import exec from '../../exec'

test('resolve-scripts dev --host=http://test.test', async () => {
  const json = await exec('resolve-scripts dev --host=http://test.test')

  expect(json).toHaveProperty('start', true)
  expect(json).toHaveProperty('host', 'http://test.test')
})
