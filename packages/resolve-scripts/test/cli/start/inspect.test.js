import exec from '../../exec'

test('resolve-scripts start --inspect', async () => {
  const json = await exec('resolve-scripts start --inspect')

  expect(json).toHaveProperty('inspectHost', '127.0.0.1')
  expect(json).toHaveProperty('inspectPort', 9229)
})

test('resolve-scripts start --inspect=1234', async () => {
  const json = await exec('resolve-scripts start --inspect=1234')

  expect(json).toHaveProperty('inspectHost', '127.0.0.1')
  expect(json).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts start --inspect=0.0.0.0:1234', async () => {
  const json = await exec('resolve-scripts start --inspect=0.0.0.0:1234')

  expect(json).toHaveProperty('inspectHost', '0.0.0.0')
  expect(json).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts start --inspect=INCORRECT_PORT (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts start --inspect=INCORRECT_PORT')
  ).rejects.toThrow()
})

test('resolve-scripts start --inspect=INCORRECT_HOST (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts start --inspect=1.2.3.4.5:1234')
  ).rejects.toThrow()
})
