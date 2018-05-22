import exec from '../../exec'

test('resolve-scripts build', async () => {
  const { deployOptions } = await exec('resolve-scripts build')

  expect(deployOptions).toHaveProperty('watch', false)
})

test('resolve-scripts build --watch', async () => {
  const { deployOptions } = await exec('resolve-scripts build --watch')

  expect(deployOptions).toHaveProperty('watch', true)
})
