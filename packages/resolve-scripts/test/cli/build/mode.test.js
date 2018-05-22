import exec from '../../exec'

test('resolve-scripts build', async () => {
  const { deployOptions } = await exec('resolve-scripts build')

  expect(deployOptions).toHaveProperty('build', true)
  expect(deployOptions).toHaveProperty('mode', 'production')
})

test('resolve-scripts build --dev', async () => {
  const { deployOptions } = await exec('resolve-scripts build --dev')

  expect(deployOptions).toHaveProperty('build', true)
  expect(deployOptions).toHaveProperty('mode', 'development')
})

test('resolve-scripts build --prod', async () => {
  const { deployOptions } = await exec('resolve-scripts build --prod')

  expect(deployOptions).toHaveProperty('build', true)
  expect(deployOptions).toHaveProperty('mode', 'production')
})

test('resolve-scripts build --test', async () => {
  const { deployOptions } = await exec('resolve-scripts build --test')

  expect(deployOptions).toHaveProperty('build', true)
  expect(deployOptions).toHaveProperty('mode', 'production')
  expect(deployOptions).toHaveProperty('test', true)
})

test('resolve-scripts build --dev --test', async () => {
  const { deployOptions } = await exec('resolve-scripts build --dev --test')

  expect(deployOptions).toHaveProperty('build', true)
  expect(deployOptions).toHaveProperty('mode', 'development')
  expect(deployOptions).toHaveProperty('test', true)
})

test('resolve-scripts build --dev --prod (fail)', async () => {
  expect.assertions(1)
  await expect(exec('resolve-scripts build --dev --prod')).rejects.toThrow()
})
