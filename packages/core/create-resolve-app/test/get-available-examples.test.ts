import { mocked } from 'ts-jest/utils'
import { getAvailableExamples } from '../src/get-available-examples'
import { loadPackageJson } from '../src/utils'
import { sync } from 'glob'
import path from 'path'

jest.mock('glob', () => ({
  sync: jest.fn(),
}))
jest.mock('../src/utils', () => ({
  loadPackageJson: jest.fn(),
}))

const mockedGlob = mocked(sync)
const mockedLoadPackage = mocked(loadPackageJson)

describe('getAvailableExamples', () => {
  beforeEach(() => {
    mockedGlob
      .mockImplementationOnce((source, { cwd }: any) => [
        path.normalize(`${cwd}/examples/ts/example-1/package.json`),
        path.normalize(`${cwd}/examples/ts/non-template/package.json`),
        path.normalize(`${cwd}/examples/ts/no-description/package.json`),
      ])
      .mockImplementationOnce((source, { cwd }: any) => [
        path.normalize(
          `${cwd}/templates/ts/inner/folder/template-1/package.json`
        ),
        path.normalize(`${cwd}/templates/ts/non-template/package.json`),
        path.normalize(`${cwd}/templates/ts/no-description/package.json`),
      ])

    mockedLoadPackage
      .mockReturnValueOnce({
        name: 'example-1',
        description: 'Dummy example 1',
        resolveJs: { isAppTemplate: true },
      })
      .mockReturnValueOnce({
        name: 'example-2',
        description: 'Dummy example 2',
        resolveJs: { isAppTemplate: false },
      })
      .mockReturnValueOnce({
        name: 'example-3',
        description: '',
        resolveJs: { isAppTemplate: true },
      })
      .mockReturnValueOnce({
        name: 'template-1',
        description: 'Dummy template 1',
        resolveJs: { isAppTemplate: true },
      })
      .mockReturnValueOnce({
        name: 'template-2',
        description: 'Dummy template 2',
        resolveJs: { isAppTemplate: false },
      })
      .mockReturnValueOnce({
        name: 'template-3',
        description: '',
        resolveJs: { isAppTemplate: true },
      })
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('filters templates correctly and returns relative paths', async () => {
    const result = getAvailableExamples('/my/root-path')
    expect(result).toHaveLength(2)
    expect(result[0].path).toEqual('examples/ts/example-1')
    expect(result[1].path).toEqual('templates/ts/inner/folder/template-1')
  })
  test('returns correct relative paths for non-normalized root path', async () => {
    const result = getAvailableExamples('///my//../root-path////')
    expect(result[0].path).toEqual('examples/ts/example-1')
    expect(result[1].path).toEqual('templates/ts/inner/folder/template-1')
  })
})
