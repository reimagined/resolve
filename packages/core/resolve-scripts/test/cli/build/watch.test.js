import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts build', async () => {
  const { resolveConfig } = await exec('resolve-scripts build')

  expect(resolveConfig).toHaveProperty('watch', false)
})

test('resolve-scripts build --watch', async () => {
  const { resolveConfig } = await exec('resolve-scripts build --watch')

  expect(resolveConfig).toHaveProperty('watch', true)
})
