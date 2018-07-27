import exec from '../../exec'

jest.setTimeout(30000)

test('resolve-scripts start --inspect', async () => {
  const { resolveConfig } = await exec('resolve-scripts start --inspect')

  expect(resolveConfig).toHaveProperty('inspectHost', '127.0.0.1')
  expect(resolveConfig).toHaveProperty('inspectPort', 9229)
})

test('resolve-scripts start --inspect=1234', async () => {
  const { resolveConfig } = await exec('resolve-scripts start --inspect=1234')

  expect(resolveConfig).toHaveProperty('inspectHost', '127.0.0.1')
  expect(resolveConfig).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts start --inspect=0.0.0.0:1234', async () => {
  const { resolveConfig } = await exec(
    'resolve-scripts start --inspect=0.0.0.0:1234'
  )

  expect(resolveConfig).toHaveProperty('inspectHost', '0.0.0.0')
  expect(resolveConfig).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts start --inspect=INCORRECT_PORT (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts start --inspect=INCORRECT_PORT')
  ).rejects.not.toBeUndefined()
})

test('resolve-scripts start --inspect=INCORRECT_HOST (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts start --inspect=1.2.3.4.5:1234')
  ).rejects.not.toBeUndefined()
})
