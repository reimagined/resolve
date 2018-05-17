import exec from '../../exec'

test('resolve-scripts build --start --inspect', async () => {
  const json = await exec('resolve-scripts build --start --inspect')

  expect(json).toHaveProperty('inspectHost', '127.0.0.1')
  expect(json).toHaveProperty('inspectPort', 9229)
})

test('resolve-scripts build --start --inspect=1234', async () => {
  const json = await exec('resolve-scripts build --start --inspect=1234')

  expect(json).toHaveProperty('inspectHost', '127.0.0.1')
  expect(json).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts build --start --inspect=0.0.0.0:1234', async () => {
  const json = await exec(
    'resolve-scripts build --start --inspect=0.0.0.0:1234'
  )

  expect(json).toHaveProperty('inspectHost', '0.0.0.0')
  expect(json).toHaveProperty('inspectPort', 1234)
})

test('resolve-scripts build --inspect=INCORRECT_PORT (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --inspect=INCORRECT_PORT')
  ).rejects.toThrow()
})

test('resolve-scripts build --inspect=INCORRECT_HOST (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --inspect=1.2.3.4.5:1234')
  ).rejects.toThrow()
})

test('resolve-scripts build --inspect (fail)', async () => {
  expect.assertions(1)
  await expect(exec('resolve-scripts build --inspect')).rejects.toThrow()
})
