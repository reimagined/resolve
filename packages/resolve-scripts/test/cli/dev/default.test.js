import exec from '../../exec'

test('resolve-scripts dev', async () => {
  const { deployOptions } = await exec('resolve-scripts dev')

  expect(deployOptions).toHaveProperty('build', true)
  expect(deployOptions).toHaveProperty('start', true)
  expect(deployOptions).toHaveProperty('mode', 'development')
})
