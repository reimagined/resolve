import getKey from '../src/get-key'

test('View-model get key should get key for array', async () => {
  expect(getKey(['c', 'b', 'a', 'd'])).toEqual(
    ['c', 'b', 'a', 'd'].sort().join(',')
  )
})

test('View-model get key should get key for scalar', async () => {
  expect(getKey('key')).toEqual('key')
})
