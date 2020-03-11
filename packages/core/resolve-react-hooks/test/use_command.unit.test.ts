import { useContext, useCallback, useDebugValue } from 'react'
import { mocked } from 'ts-jest/utils'
import { getClient, Command } from 'resolve-client'
import { useCommand } from '../src/use_command'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => 'mocked-context'),
  useCallback: jest.fn(cb => cb)
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedGetApi = mocked(getClient)
const mockedUseContext = mocked(useContext)
const mockedUseCallback = mocked(useCallback)

const mockedClient = {
  command: jest.fn(),
  query: jest.fn(),
  getStaticAssetUrl: jest.fn(),
  subscribeTo: jest.fn(),
  unsubscribe: jest.fn()
}

const clearMocks = () => {
  mockedGetApi.mockClear()

  mockedUseContext.mockClear()
  mockedUseCallback.mockClear()

  mockedClient.command.mockClear()
}

beforeAll(() => {
  mockedGetApi.mockReturnValue(mockedClient)
})

afterEach(() => {
  clearMocks()
})

test('client requested for specified context', () => {
  useCommand({
    type: 'create',
    aggregateName: 'user',
    aggregateId: 'new',
    payload: {
      name: 'username'
    }
  })

  expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
  expect(getClient).toHaveBeenCalledWith('mocked-context')
})

test('successfully passed to underlying client', () => {
  const command = {
    type: 'create',
    aggregateName: 'user',
    aggregateId: 'new',
    payload: {
      name: 'username'
    }
  }

  useCommand(command)()

  expect(mockedClient.command).toHaveBeenCalledWith(
    command,
    undefined,
    undefined
  )
})

