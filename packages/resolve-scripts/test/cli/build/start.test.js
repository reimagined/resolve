import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts build', async () => {
  const { deployOptions } = await exec('resolve-scripts build')

  expect(deployOptions).toHaveProperty('start', false)
})

test('resolve-scripts build --start', async () => {
  const { deployOptions } = await exec('resolve-scripts build --start')

  expect(deployOptions).toHaveProperty('start', true)
})
