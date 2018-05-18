import exec from '../../exec'

test('resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build')

  expect(json).toHaveProperty('watch', false)
})

test('resolve-scripts build --watch', async () => {
  const json = await exec('resolve-scripts build --watch')

  expect(json).toHaveProperty('watch', true)
})

test('WATCH=false resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', { WATCH: false })

  expect(json).toHaveProperty('watch', false)
})

test('WATCH=true resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', { WATCH: true })

  expect(json).toHaveProperty('watch', true)
})
