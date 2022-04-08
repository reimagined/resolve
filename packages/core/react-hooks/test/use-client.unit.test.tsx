import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { mocked } from 'jest-mock'
import { getClient } from '@resolve-js/client'
import { ResolveContext } from '../src/context'
import { useClient } from '../src/use-client'

jest.mock('@resolve-js/client')

const mockedGetClient = mocked(getClient)

const clearMocks = (): void => {
  mockedGetClient.mockClear()
}

const mockContext = {
  origin: 'mock-origin',
  rootPath: 'mock-root-path',
  staticPath: 'mock-static-path',
  viewModels: [],
}

const renderWrapped = () =>
  renderHook(() => useClient(), {
    wrapper: (props) => (
      <ResolveContext.Provider value={props.context}>
        {props.children}
      </ResolveContext.Provider>
    ),
    initialProps: {
      context: mockContext,
    },
  })

beforeAll(() => {
  mockedGetClient.mockImplementation(() => Object.create({}))
})

afterEach(() => {
  clearMocks()
})

test('client requested for specified context', () => {
  renderWrapped()

  expect(getClient).toHaveBeenCalledWith(mockContext)
})

test('fail if not context found', () => {
  expect(() => useClient()).toThrow()
  expect(mockedGetClient).not.toHaveBeenCalled()
})

test('use cached client for the same context', () => {
  const hook = renderWrapped()
  const clientA = hook.result.current
  hook.rerender()
  expect(hook.result.current).toEqual(clientA)
})

test('return new client on context change', () => {
  const hook = renderWrapped()
  const clientA = hook.result.current
  hook.rerender({
    context: {
      ...mockContext,
    },
  })
  expect(hook.result.current).not.toBe(clientA)
})
