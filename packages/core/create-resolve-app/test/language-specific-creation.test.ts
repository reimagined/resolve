import fs from 'fs-extra'
import moveExample from '../src/move-example'
import { moveSync } from 'fs-extra'
import { mocked } from 'jest-mock'

jest.mock('fs-extra', () => ({
  moveSync: jest.fn(),
  removeSync: jest.fn(),
  readdirSync: jest.fn().mockReturnValue(['one']),
}))

jest.mock('../src/get-available-examples', () => ({
  getAvailableExamples: jest.fn().mockReturnValue([
    {
      name: 'language-unspecified-example',
      description: 'Dummy reSolve example',
      path: '/language-unspecified-example',
    },
    {
      name: 'two-language-example-ts',
      description: 'Dummy reSolve example',
      path: '/two-language-example-ts',
    },
    {
      name: 'two-language-example-js',
      description: 'Dummy reSolve example',
      path: '/two-language-example-js',
    },
    {
      name: 'js-example-js',
      description: 'Dummy reSolve example',
      path: '/js-example-js',
    },
    {
      name: 'ts-example-ts',
      description: 'Dummy reSolve example',
      path: '/ts-example-ts',
    },
  ]),
}))

fs.existsSync = jest.fn().mockReturnValue(true)

const mockedMoveSync = mocked(moveSync)

afterEach(() => mockedMoveSync.mockClear())

afterAll(() => jest.clearAllMocks())

test('moveExample works correctly for ts', async () => {
  await moveExample('./app-path', './clone-path', 'two-language-example', true)
  expect(
    moveSync
  ).toHaveBeenCalledWith(
    'clone-path/two-language-example-ts/one',
    'app-path/one',
    { overwrite: true }
  )
})
test('moveExample works correctly for js', async () => {
  await moveExample('./app-path', './clone-path', 'two-language-example', false)
  expect(
    moveSync
  ).toHaveBeenCalledWith(
    'clone-path/two-language-example-js/one',
    'app-path/one',
    { overwrite: true }
  )
})
test('moveExample works correctly for non-specified language', async () => {
  await moveExample(
    './app-path',
    './clone-path',
    'language-unspecified-example',
    false
  )
  await moveExample(
    './app-path',
    './clone-path',
    'language-unspecified-example',
    true
  )
  expect(moveSync).toHaveBeenNthCalledWith(
    1,
    'clone-path/language-unspecified-example/one',
    'app-path/one',
    { overwrite: true }
  )
  expect(moveSync).toHaveBeenNthCalledWith(
    2,
    'clone-path/language-unspecified-example/one',
    'app-path/one',
    { overwrite: true }
  )
})
test('moveExample throws if example not found for specified language', async () => {
  try {
    await moveExample('./app-path', './clone-path', 'js-example', true)
    throw new Error('Error should be thrown for non-existing ts example')
  } catch (err) {
    const message = String(err)
    expect(message).toContain('No such example')
  }
  try {
    await moveExample('./app-path', './clone-path', 'ts-example', false)
    throw new Error('Error should be thrown for non-existing js example')
  } catch (err) {
    const message = String(err)
    expect(message).toContain('No such example')
  }
})
