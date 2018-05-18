import exec from '../../exec'

test('resolve-scripts dev', async () => {
  const json = await exec('resolve-scripts dev')

  expect(json).toHaveProperty('build', true)
  expect(json).toHaveProperty('start', true)
  expect(json).toHaveProperty('mode', 'development')
})
