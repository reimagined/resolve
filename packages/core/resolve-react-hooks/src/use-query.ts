import { Query, QueryOptions, QueryResult, QueryCallback } from 'resolve-client'
import { useCallback } from 'react'
import { HookExecutor, isCallback, isDependencies, isOptions } from './generic'
import { useClient } from './use-client'
import { firstOfType } from 'resolve-core'

export type QueryBuilder<T> = (data: T) => Query
export type QueryExecutor<T> = HookExecutor<T, QueryResult>

function useQuery(query: Query): QueryExecutor<void>
function useQuery(query: Query, options: QueryOptions): QueryExecutor<void>
function useQuery(query: Query, callback: QueryCallback): QueryExecutor<void>
function useQuery(query: Query, dependencies: any[]): QueryExecutor<void>
function useQuery(
  query: Query,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor<void>
function useQuery(
  query: Query,
  options: QueryOptions,
  callback: QueryCallback
): QueryExecutor<void>
function useQuery(
  query: Query,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<void>
function useQuery(
  query: Query,
  options: QueryOptions,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor<void>
function useQuery<T>(builder: QueryBuilder<T>): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions
): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  callback: QueryCallback
): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  dependencies: any[]
): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions,
  callback: QueryCallback
): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<T>
function useQuery<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor<T>
function useQuery<T>(
  query: Query | QueryBuilder<T>,
  options?: QueryOptions | QueryCallback | any[],
  callback?: QueryCallback | any[],
  dependencies?: any[]
): QueryExecutor<T> {
  const client = useClient()
  const actualOptions: QueryOptions | undefined = firstOfType<QueryOptions>(
    isOptions,
    options
  )
  const actualCallback: QueryCallback | undefined = firstOfType<QueryCallback>(
    isCallback,
    options,
    callback
  )
  const actualDependencies = firstOfType<any[]>(
    isDependencies,
    options,
    callback,
    dependencies
  )

  if (typeof query === 'function') {
    if (isDependencies(actualDependencies)) {
      return useCallback(
        (data: T): Promise<QueryResult> | void =>
          client.query(query(data), actualOptions, actualCallback),
        [client, ...actualDependencies]
      )
    }
    return (data: T): Promise<QueryResult> | void =>
      client.query(query(data), actualOptions, actualCallback)
  }

  if (isDependencies(actualDependencies)) {
    return useCallback(
      (): Promise<QueryResult> | void =>
        client.query(query, actualOptions, actualCallback),
      [client, ...actualDependencies]
    )
  }
  return () => client.query(query, actualOptions, actualCallback)
}

export { useQuery }
