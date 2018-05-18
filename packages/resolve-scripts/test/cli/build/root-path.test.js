import exec from '../../exec'

test('resolve-scripts build --root-path=test', async () => {
  const json = await exec('resolve-scripts build --root-path=test')

  expect(json).toHaveProperty('rootPath', 'test')
})

test('resolve-scripts build --root-path=😉', async () => {
  const json = await exec('resolve-scripts build --root-path=😉')

  expect(json).toHaveProperty('rootPath', encodeURI('😉'))
})

test('resolve-scripts build --root-path=/test (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --root-path=/test')
  ).rejects.toThrow()
})

test('resolve-scripts build --root-path=test/ (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --root-path=test/')
  ).rejects.toThrow()
})

test('resolve-scripts build --root-path=http://test (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --root-path=http://test')
  ).rejects.toThrow()
})

test('resolve-scripts build --root-path=https://test (fail)', async () => {
  expect.assertions(1)
  await expect(
    exec('resolve-scripts build --root-path=https://test')
  ).rejects.toThrow()
})
