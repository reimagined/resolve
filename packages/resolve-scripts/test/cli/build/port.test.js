import exec from '../../exec'

test('resolve-scripts build --start --port=1234', async () => {
  const json = await exec('resolve-scripts build --start --port=1234')

  expect(json).toHaveProperty('start', true)
  expect(json).toHaveProperty('port', 1234)
})

test('resolve-scripts build --port=1234 (fail)', async () => {
  expect.assertions(1)
  await expect(exec('resolve-scripts build --port=1234')).rejects.toThrow()
})
