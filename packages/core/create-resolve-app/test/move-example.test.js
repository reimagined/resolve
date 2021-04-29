import moveExample from '../src/move-example'
import { moveSync, removeSync } from 'fs-extra'
jest.mock('fs-extra', () => ({
  moveSync: jest.fn(),
  removeSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue(['one', 'two']),
}))
jest.mock('../src/test-example-exists', () => jest.fn())
test('moveExample works correctly', async () => {
  await moveExample('./app-path', './clone-path', 'dummy-example')
  expect(moveSync).toHaveBeenNthCalledWith(
    1,
    'clone-path/examples/dummy-example/one',
    'app-path/one',
    { overwrite: true }
  )
  expect(moveSync).toHaveBeenNthCalledWith(
    2,
    'clone-path/examples/dummy-example/two',
    'app-path/two',
    { overwrite: true }
  )
  expect(removeSync).toHaveBeenCalledWith('./clone-path')
})
