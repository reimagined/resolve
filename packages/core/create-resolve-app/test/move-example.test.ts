import fs from 'fs-extra'
import moveExample from '../src/move-example'
import { moveSync, removeSync } from 'fs-extra'

jest.mock('fs-extra', () => ({
  moveSync: jest.fn(),
  removeSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue(['one', 'two']),
}))

jest.mock('../src/get-available-examples', () => ({
  getAvailableExamples: jest.fn().mockReturnValue([
    {
      name: 'dummy-example',
      description: 'Dummy reSolve example',
      path: '/dummy-example',
    },
  ]),
}))

afterAll(() => jest.clearAllMocks())

test('moveExample works correctly', async () => {
  fs.existsSync = jest.fn().mockReturnValue(true)

  await moveExample('./app-path', './clone-path', 'dummy-example')
  expect(moveSync).toHaveBeenNthCalledWith(
    1,
    'clone-path/dummy-example/one',
    'app-path/one',
    { overwrite: true }
  )
  expect(moveSync).toHaveBeenNthCalledWith(
    2,
    'clone-path/dummy-example/two',
    'app-path/two',
    { overwrite: true }
  )
  expect(removeSync).toHaveBeenCalledWith('./clone-path')
})
test('throws correct error if example is missing', async () => {
  fs.existsSync = jest.fn().mockReturnValue(false)
  try {
    await moveExample('./app-path', './clone-path', 'nonexistent-example')
    fail('Error should be thrown')
  } catch (err) {
    const message = String(err)
    expect(message).toContain('No such example')
    expect(message).toContain('dummy-example - Dummy reSolve example')
  }
})
