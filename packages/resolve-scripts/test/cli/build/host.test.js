import exec from '../../exec'

test('resolve-scripts build --start --host=http://test.test', async () => {
  const { host, deployOptions } = await exec(
    'resolve-scripts build --start --host=http://test.test'
  )

  expect(deployOptions).toHaveProperty('start', true)
  expect(host).toEqual('http://test.test')
})

test('resolve-scripts build --host=http://test.test (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --host=http://test.test')
  ).rejects.toThrow()
})
