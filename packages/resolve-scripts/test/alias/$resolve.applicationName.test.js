import alias from '../../src/core/alias/$resolve.applicationName'

test('works correctly', () => {
  const deployOptions = {
    applicationName: 'test'
  }

  expect(
    '\r\n' +
      alias({
        deployOptions
      }).code +
      '\r\n'
  ).toMatchSnapshot()
})
