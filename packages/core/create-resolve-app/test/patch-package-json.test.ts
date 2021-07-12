import { resolveVersion } from '../src/constants'
import patchPackageJson from '../src/patch-package-json'
import { readdirSync, writeFileSync } from 'fs-extra'
import { mocked } from 'ts-jest/utils'

jest.mock(
  'package.json',
  () => ({
    name: 'example-name',
    version: '1.0.0',
    dependencies: {
      '@resolve-js/core': '0.0.1',
      'non-resolve-package': '0.0.1',
      'my-app': '0.0.1',
    },
    devDependencies: {
      '@resolve-js/core': '0.0.1',
      'non-resolve-package': '0.0.1',
      'my-app': '0.0.1',
    },
    peerDependencies: {
      '@resolve-js/core': '0.0.1',
      'non-resolve-package': '0.0.1',
      'my-app': '0.0.1',
    },
    optionalDependencies: {
      '@resolve-js/core': '0.0.1',
      'non-resolve-package': '0.0.1',
      'my-app': '0.0.1',
    },
  }),
  {
    virtual: true,
  }
)

jest.mock('fs-extra')

const writeFileSyncMock = mocked(writeFileSync)
const readdirSyncMock = mocked(readdirSync)
readdirSyncMock.mockReturnValue([])

afterAll(() => {
  jest.clearAllMocks()
})

test('patchPackageJson patches versions correctly', async () => {
  await patchPackageJson('my-app', '.', false)
  expect(writeFileSyncMock.mock.calls[1][1]).toEqual(
    JSON.stringify(
      {
        name: 'my-app',
        version: resolveVersion,
        dependencies: {
          '@resolve-js/core': resolveVersion,
          'non-resolve-package': '0.0.1',
          'my-app': '0.0.1',
        },
        devDependencies: {
          '@resolve-js/core': resolveVersion,
          'non-resolve-package': '0.0.1',
          'my-app': '0.0.1',
        },
        peerDependencies: {
          '@resolve-js/core': resolveVersion,
          'non-resolve-package': '0.0.1',
          'my-app': '0.0.1',
        },
        optionalDependencies: {
          '@resolve-js/core': resolveVersion,
          'non-resolve-package': '0.0.1',
          'my-app': '0.0.1',
        },
      },
      null,
      2
    )
  )
})
