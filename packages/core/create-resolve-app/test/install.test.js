import { execSync } from 'child_process'
import install from '../src/install'
import isYarnAvailable from '../src/is-yarn-available.js'

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))
jest.mock('../src/is-yarn-available.js', () => jest.fn())

describe('dependencies installation', () => {
  afterAll(() => {
    jest.resetModules()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('with yarn', async () => {
    isYarnAvailable.mockReturnValue(true)
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
    isYarnAvailable.mockReturnValue(false)
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
