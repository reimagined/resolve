import exec from '../../exec'

test('resolve-scripts dev --host=http://test.test', async () => {
  const { host, deployOptions } = await exec(
    'resolve-scripts dev --host=http://test.test'
  )

  expect(deployOptions).toHaveProperty('start', true)
  expect(host).toEqual('http://test.test')
})
