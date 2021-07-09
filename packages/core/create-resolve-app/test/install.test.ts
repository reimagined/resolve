import { execSync } from 'child_process'
import { mocked } from 'ts-jest/utils'
import install from '../src/install'
import isYarnAvailable from '../src/is-yarn-available'

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))
jest.mock('../src/is-yarn-available', () => jest.fn())

const mockedIsYarnAvailable = mocked(isYarnAvailable)

describe('dependencies installation', () => {
  afterAll(() => {
    jest.resetModules()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('with yarn', async () => {
    mockedIsYarnAvailable.mockReturnValue(true)
    await install('./')
    expect(execSync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('yarn --mutex file'),
      expect.anything()
    )
    expect(execSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('yarn add --dev resolve-cloud'),
      expect.anything()
    )
  })
  test('with npm', async () => {
    mockedIsYarnAvailable.mockReturnValue(false)
    await install('./')
    expect(execSync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('npm install'),
      expect.anything()
    )
    expect(execSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('npm install --save-dev resolve-cloud'),
      expect.anything()
    )
  })
})
