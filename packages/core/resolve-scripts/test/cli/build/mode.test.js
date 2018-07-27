import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts build', async () => {
  const { resolveConfig } = await exec('resolve-scripts build')

  expect(resolveConfig).toHaveProperty('build', true)
  expect(resolveConfig).toHaveProperty('mode', 'production')
})

test('resolve-scripts build --dev', async () => {
  const { resolveConfig } = await exec('resolve-scripts build --dev')

  expect(resolveConfig).toHaveProperty('build', true)
  expect(resolveConfig).toHaveProperty('mode', 'development')
})

test('resolve-scripts build --prod', async () => {
  const { resolveConfig } = await exec('resolve-scripts build --prod')

  expect(resolveConfig).toHaveProperty('build', true)
  expect(resolveConfig).toHaveProperty('mode', 'production')
})

test('resolve-scripts build --test', async () => {
  const { resolveConfig } = await exec('resolve-scripts build --test')

  expect(resolveConfig).toHaveProperty('build', true)
  expect(resolveConfig).toHaveProperty('mode', 'production')
  expect(resolveConfig).toHaveProperty('test', true)
})

test('resolve-scripts build --dev --test', async () => {
  const { resolveConfig } = await exec('resolve-scripts build --dev --test')

  expect(resolveConfig).toHaveProperty('build', true)
  expect(resolveConfig).toHaveProperty('mode', 'development')
  expect(resolveConfig).toHaveProperty('test', true)
})

test('resolve-scripts build --dev --prod (fail)', async () => {
  expect.assertions(1)

  await expect(
    exec('resolve-scripts build --dev --prod')
  ).rejects.not.toBeUndefined()
})
