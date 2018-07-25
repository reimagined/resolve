import alias from '../../src/core/alias/$resolve.assemblies'

test('works correctly', () => {
  expect(alias()).toMatchSnapshot()
})
