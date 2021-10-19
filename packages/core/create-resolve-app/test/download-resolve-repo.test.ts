import downloadResolveRepo from '../src/download-resolve-repo'
import fs from 'fs-extra'
import https from 'https'
import { mocked } from 'ts-jest/utils'
import { resolveVersion } from '../src/constants'

import { Writable } from 'stream'

class MockedStream extends Writable {
  _write(chunk: any, _: any, next: () => any) {
    next()
  }
}

jest.mock('adm-zip', () => {
  let admZipExtractAllMock = jest.fn()
  return {
    __esModule: true,
    admZipExtractAllMock,
    default: jest.fn(() => ({ extractAllTo: admZipExtractAllMock })),
  }
})
jest.mock('fs-extra')
jest.mock('https')

describe('downloadResolveRepo', () => {
  afterAll(() => {
    jest.resetModules()
  })
  beforeEach(() => {
    const mockResponse = {
      write: jest.fn(),
      on: jest.fn(),
      end: jest.fn(),
      headers: { 'content-length': 100 },
    }
    mockResponse.on.mockImplementation((event, cb) => {
      if (event === 'end' || event === 'error') {
        cb()
      }
    })
    https.get = jest.fn().mockImplementation((url, callback) => {
      callback(mockResponse)
    })

    fs.removeSync = jest.fn()
    fs.readdirSync = jest
      .fn()
      .mockReturnValueOnce([])
      .mockReturnValueOnce(['resolve'])
    fs.createWriteStream = jest.fn().mockReturnValueOnce(new MockedStream())
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('works correctly with current resolve version', async () => {
    const resultingPath = await downloadResolveRepo('./my-app')
    expect(resultingPath).toEqual('my-app/resolve')
    const mockedGet = mocked(https.get)
    expect(mockedGet.mock.calls[0][0]).toEqual(
      `https://codeload.github.com/reimagined/resolve/zip/V${resolveVersion}`
    )
    expect(fs.removeSync).toHaveBeenCalledWith(
      `my-app/resolve-V${resolveVersion}.zip`
    )
  })
  test('works correctly with branch', async () => {
    const resultingPath = await downloadResolveRepo('./my-app', 'dev')
    expect(resultingPath).toEqual('my-app/resolve')
    const mockedGet = mocked(https.get)
    expect(mockedGet.mock.calls[0][0]).toEqual(
      'https://codeload.github.com/reimagined/resolve/zip/dev'
    )
    expect(fs.removeSync).toHaveBeenCalledWith(`my-app/resolve-dev.zip`)
  })
  test('works correctly with commit', async () => {
    const resultingPath = await downloadResolveRepo(
      './my-app',
      '',
      '93476e2c437df60a4c234af872fd3658732e919c'
    )
    expect(resultingPath).toEqual('my-app/resolve')
    const mockedGet = mocked(https.get)
    expect(mockedGet.mock.calls[0][0]).toEqual(
      'https://codeload.github.com/reimagined/resolve/zip/93476e2c437df60a4c234af872fd3658732e919c'
    )
    expect(fs.removeSync).toHaveBeenCalledWith(
      `my-app/resolve-93476e2c437df60a4c234af872fd3658732e919c.zip`
    )
  })
  test('throws if target directory is not empty', async () => {
    fs.readdirSync = jest.fn().mockReturnValueOnce(['dummy'])
    expect(() => downloadResolveRepo('./my-app')).rejects.toThrow(
      'Failed to create resolve application. Target directory is not empty.'
    )
  })
})
