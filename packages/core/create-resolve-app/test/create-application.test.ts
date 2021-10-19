import path from 'path'
import checkApplicationName from '../src/check-application-name'
import downloadResolveRepo from '../src/download-resolve-repo'
import moveExampleToApplicationPath from '../src/move-example'
import patchPackageJson from '../src/patch-package-json'
import install from '../src/install'
import createApplication from '../src/create-application'

jest.mock('../src/message', () => ({
  __esModule: true,
  default: { startCreatingApp: jest.fn() },
}))
jest.mock('../src/check-application-name', () => jest.fn())
jest.mock('../src/download-resolve-repo', () =>
  jest.fn().mockReturnValue('/clone-path')
)
jest.mock('../src/move-example', () => jest.fn())
jest.mock('../src/patch-package-json', () => jest.fn())
jest.mock('../src/install', () => jest.fn())
jest.mock('../src/print-finish-output', () => jest.fn())

afterAll(() => {
  jest.clearAllMocks()
})

test('createApplication steps', async () => {
  await createApplication(
    'dummy-app',
    'hacker-news',
    false,
    'commit-hash',
    'branch-name'
  )
  const appPath = path.join(process.cwd(), 'dummy-app')
  expect(checkApplicationName).toHaveBeenCalledWith('dummy-app')
  expect(downloadResolveRepo).toHaveBeenCalledWith(
    appPath,
    'branch-name',
    'commit-hash'
  )
  expect(moveExampleToApplicationPath).toHaveBeenCalledWith(
    appPath,
    '/clone-path',
    'hacker-news',
    false
  )
  expect(patchPackageJson).toHaveBeenCalledWith('dummy-app', appPath, false)
  expect(install).toHaveBeenCalledWith(appPath)
})
