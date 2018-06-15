import exec from '../../exec'

test('resolve-scripts dev --port=1234', async () => {
  const { port, deployOptions } = await exec('resolve-scripts dev --port=1234')

  expect(deployOptions).toHaveProperty('start', true)
  expect(port).toEqual(1234)
})
