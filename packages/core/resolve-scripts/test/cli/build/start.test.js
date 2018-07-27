import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts build', async () => {
  const { resolveConfig } = await exec('resolve-scripts build')

  expect(resolveConfig).toHaveProperty('start', false)
})

test('resolve-scripts build --start', async () => {
  const { resolveConfig } = await exec('resolve-scripts build --start')

  expect(resolveConfig).toHaveProperty('start', true)
})
