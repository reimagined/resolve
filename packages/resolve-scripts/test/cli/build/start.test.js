import exec from '../../exec'

test('resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build')

  expect(json).toHaveProperty('start', false)
})

test('resolve-scripts build --start', async () => {
  const json = await exec('resolve-scripts build --start')

  expect(json).toHaveProperty('start', true)
})

test('START=false resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', { START: false })

  expect(json).toHaveProperty('start', false)
})

test('START=true resolve-scripts build', async () => {
  const json = await exec('resolve-scripts build', { START: true })

  expect(json).toHaveProperty('start', true)
})
