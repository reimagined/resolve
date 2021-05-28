import fs from 'fs-extra'
import testExampleExists from '../src/test-example-exists'
import { resolveExamples } from '../src/constants'

beforeAll(() => {
  jest.mock('fs-extra')
})
afterAll(() => jest.clearAllMocks())

test('no error if example exists', () => {
  fs.existsSync = jest.fn().mockReturnValue(true)
  expect(() => testExampleExists('/', 'existing-example')).not.toThrow()
})
test('throws correct error if example is missing', () => {
  fs.existsSync = jest.fn().mockReturnValue(false)
  const mockExistingExamples = resolveExamples.slice(0, 3).map((e) => e.name)
  fs.readdirSync = jest
    .fn()
    .mockReturnValue(['dummy-example', ...mockExistingExamples])
  fs.statSync = jest.fn().mockReturnValue({ isDirectory: () => true })
  try {
    testExampleExists('/', 'nonexistent-example')
    fail('Error should be thrown')
  } catch (err) {
    const message = String(err)
    expect(message).toContain('No such example')
    expect(message).toContain(mockExistingExamples[0])
    expect(message).toContain(mockExistingExamples[1])
    expect(message).toContain(mockExistingExamples[2])
    expect(message).not.toContain('dummy-example')
  }
})
