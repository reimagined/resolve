import exec from '../../exec'

test('resolve-scripts build --start --port=1234', async () => {
  const { port, deployOptions } = await exec(
    'resolve-scripts build --start --port=1234'
  )

  expect(deployOptions).toHaveProperty('start', true)
  expect(port).toEqual(1234)
})
