import exec from '../../exec'

test('resolve-scripts dev --inspect', async () => {
  const { deployOptions } = await exec('resolve-scripts dev --inspect')

  expect(deployOptions).toHaveProperty('inspectHost', '127.0.0.1')
  expect(deployOptions).toHaveProperty('inspectPort', 9229)
})

test('resolve-scripts dev --inspect=1234', async () => {
  const { deployOptions } = await exec('resolve-scripts dev --inspect=1234')

  expect(deployOptions).toHaveProperty('inspectHost', '127.0.0.1')
  expect(deployOptions).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts dev --inspect=0.0.0.0:1234', async () => {
  const { deployOptions } = await exec(
    'resolve-scripts dev --inspect=0.0.0.0:1234'
  )

  expect(deployOptions).toHaveProperty('inspectHost', '0.0.0.0')
  expect(deployOptions).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts dev --inspect=INCORRECT_PORT (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts dev --inspect=INCORRECT_PORT')
  ).rejects.not.toBeUndefined()
})

test('resolve-scripts dev --inspect=INCORRECT_HOST (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts dev --inspect=1.2.3.4.5:1234')
  ).rejects.not.toBeUndefined()
})
