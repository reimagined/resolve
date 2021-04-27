import checkApplicationName from '../src/check-application-name'

describe('checkApplicationName', () => {
  test('works correctly for valid project name', async () => {
    try {
      const result = await checkApplicationName('valid-project-name')
      expect(result).toBeUndefined()
    } catch (err) {
      fail(`Unexpected exception: ${err}`)
    }
  })
  test('throws error if project name is not valid for npm', async () => {
    const invalidName = '.invalid-project-name'
    try {
      await checkApplicationName(invalidName)
      fail('Exception should be thrown for invalid application name')
    } catch (err) {
      expect(err).toContain(`It is impossible to create an application`)
      expect(err).toContain(invalidName)
    }
  })
})
