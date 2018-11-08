import alias from '../../src/alias/$resolve.assemblies'

test('works correctly', () => {
  expect(alias()).toMatchSnapshot()
})
