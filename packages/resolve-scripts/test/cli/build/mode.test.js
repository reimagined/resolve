import exec from '../../exec'

test('resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build')

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('mode', 'production')
})

test('resolve-scripts build --dev', async () => {
  const json = await exec('resolve-scripts build --dev')

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('mode', 'development')
})

test('resolve-scripts build --prod', async () => {
  const json = await exec('resolve-scripts build --prod')

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('mode', 'production')
})

test('resolve-scripts build --dev --prod (fail)', async () => {
  expect.assertions(1)
  await expect(exec('resolve-scripts build --dev --prod')).rejects.toThrow()
})

test('NODE_ENV=production resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', {
    NODE_ENV: 'production'
  })

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('mode', 'production')
})

test('NODE_ENV=development resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', {
    NODE_ENV: 'development'
  })

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('mode', 'development')
})

test('NODE_ENV=test resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', {
    NODE_ENV: 'test'
  })

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('mode', 'development')
})

test('NODE_ENV=INCORRECT_VALUE resolve-scripts build (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build', { NODE_ENV: 'INCORRECT_VALUE' })
  ).rejects.toThrow()
})
