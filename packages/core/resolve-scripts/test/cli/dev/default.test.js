import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts dev', async () => {
  const { resolveConfig } = await exec('resolve-scripts dev')

  expect(resolveConfig).toHaveProperty('build', true)
  expect(resolveConfig).toHaveProperty('start', true)
  expect(resolveConfig).toHaveProperty('mode', 'development')
})
