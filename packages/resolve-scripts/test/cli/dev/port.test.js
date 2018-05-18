import exec from '../../exec'

test('resolve-scripts dev --port=1234', async () => {
  const json = await exec('resolve-scripts dev --port=1234')

  expect(json).toHaveProperty('start', true)
  expect(json).toHaveProperty('port', 1234)
})
