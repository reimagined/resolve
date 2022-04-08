import { mocked } from 'jest-mock'
import { QueryCallback, QueryOptions } from '@resolve-js/client'
import { useQuery } from '../src/use-query'
import { useQueryBuilder } from '../src/use-query-builder'

jest.mock('@resolve-js/client')
jest.mock('react', () => ({
  useCallback: jest.fn((cb) => cb),
}))
jest.mock('../src/use-query', () => ({
  useQuery: jest.fn(() => jest.fn()),
}))

const mockedUseQuery = mocked(useQuery)

const clearMocks = (): void => {
  mockedUseQuery.mockClear()
}

afterEach(() => {
  clearMocks()
})

describe('common', () => {
  test('useQuery hook called', () => {
    const queryBuilder = jest.fn()
    const queryOptions: QueryOptions = {}
    const queryCallback: QueryCallback<any> = jest.fn()
    const dependencies: any[] = []

    useQueryBuilder(queryBuilder, queryOptions, queryCallback, dependencies)

    expect(mockedUseQuery).toHaveBeenCalledWith(
      queryBuilder,
      queryOptions,
      queryCallback,
      dependencies
    )
  })

  test('variadic builder generic arguments (compile time)', () => {
    const executor = useQueryBuilder((userId: string, resolver: string) => ({
      args: {
        userId,
      },
      name: 'user',
      resolver,
    }))

    executor('user-id', 'command-name')
  })
})
