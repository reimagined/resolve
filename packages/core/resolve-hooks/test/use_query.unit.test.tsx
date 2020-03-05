import React, { FunctionComponent, ReactNode } from 'react'
import { renderHook } from '@testing-library/react-hooks'

import { mocked } from 'ts-jest/utils'
import {
  getApi,
  Query,
  QueryOptions,
  QueryCallback,
  QueryResult
} from 'resolve-api'
import { useQuery } from '../src/use_query'
import { ResolveContext } from '../src/context'

jest.mock('resolve-api')
const mockedGetApi = mocked(getApi)
const validatorMock = jest.fn()
const callbackMock = jest.fn()
const apiQueryMock = jest.fn().mockReturnValue({})

const clearMocks = () => {
  mockedGetApi.mockClear()
  apiQueryMock.mockClear()
}

const contextValue = {
  origin: '',
  rootPath: '',
  staticPath: '',
  viewModels: [
    { name: 'view-model-name', projection: [], deserializeState: () => ({}) },
    {
      name: 'another-view-model-name',
      projection: [],
      deserializeState: () => ({})
    }
  ]
}

type ContextChildrenProps = {
  children?: ReactNode
}

const contextWrapper: FunctionComponent<ContextChildrenProps> = ({
  children
}) => (
  <ResolveContext.Provider value={contextValue}>
    {children}
  </ResolveContext.Provider>
)

describe('useQuery', () => {
  beforeAll(() => {
    mockedGetApi.mockReturnValue({
      command: jest.fn(),
      query: apiQueryMock,
      getStaticAssetUrl: jest.fn(),
      subscribeTo: jest.fn(),
      unsubscribe: jest.fn()
    })
  })

  beforeEach(() => {
    clearMocks()
  })

  test('use view model query', async () => {
    renderHook(
      () =>
        useQuery(
          {
            name: 'model-name',
            aggregateIds: '*',
            args: {
              arg1: 'value-1'
            }
          },
          {
            waitFor: {
              validator: validatorMock,
              period: 5,
              attempts: 5
            }
          },
          callbackMock
        ),
      { wrapper: contextWrapper }
    )

    expect(apiQueryMock).toBeCalledTimes(1)
    expect(apiQueryMock).toBeCalledWith(
      { aggregateIds: '*', args: { arg1: 'value-1' }, name: 'model-name' },
      { waitFor: { attempts: 5, period: 5, validator: validatorMock } },
      callbackMock
    )
  })

  test('use read model query', async () => {
    renderHook(
      () =>
        useQuery(
          {
            name: 'model-name',
            resolver: 'resolver-name',
            args: {
              arg1: 'value-1'
            }
          },
          {
            waitFor: {
              validator: validatorMock,
              period: 5,
              attempts: 5
            }
          },
          callbackMock
        ),
      { wrapper: contextWrapper }
    )

    expect(apiQueryMock).toBeCalledTimes(1)
    expect(apiQueryMock).toBeCalledWith(
      {
        args: { arg1: 'value-1' },
        name: 'model-name',
        resolver: 'resolver-name'
      },
      { waitFor: { attempts: 5, period: 5, validator: validatorMock } },
      callbackMock
    )
  })
})
