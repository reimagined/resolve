import { useContext, useMemo } from 'react'
import { mocked } from 'ts-jest/utils'
import { getClient } from 'resolve-client'
import { useClient } from '../src/use_client'

jest.mock('resolve-client')
jest.mock('react', () => ({
  useContext: jest.fn(() => 'mocked-context'),
  useMemo: jest.fn(cb => cb())
}))
jest.mock('../src/context', () => ({
  ResolveContext: 'mocked-context-selector'
}))

const mockedGetClient = mocked(getClient)
const mockedUseContext = mocked(useContext)
const mockedUseMemo = mocked(useMemo)

const clearMocks = (): void => {
  mockedGetClient.mockClear()

  mockedUseContext.mockClear()
  mockedUseMemo.mockClear()
}

afterEach(() => {
  clearMocks()
})

test('client requested for specified context', () => {
  useClient()

  expect(mockedUseContext).toHaveBeenCalledWith('mocked-context-selector')
  expect(getClient).toHaveBeenCalledWith('mocked-context')
})

test('fail if not context found', () => {
  mockedUseContext.mockReturnValueOnce(null)

  expect(() => useClient()).toThrow()
  expect(mockedGetClient).not.toHaveBeenCalled()
})

test('use cached client for context', () => {
  useClient()

  expect(mockedUseMemo).toHaveBeenCalledWith(expect.any(Function), [
    'mocked-context'
  ])
})
