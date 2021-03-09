import {
  Query,
  QueryOptions,
  QueryResult,
  QueryCallback,
} from '@resolve-js/client'
import { useCallback } from 'react'
import { HookExecutor, isCallback, isDependencies, isOptions } from './generic'
import { useClient } from './use-client'
import { firstOfType } from '@resolve-js/core'

export type QueryBuilder<TArgs extends any[], TQuery extends Query> = (
  ...data: TArgs
) => TQuery
export type QueryExecutor<TArgs extends any[]> = HookExecutor<
  TArgs,
  QueryResult
>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useQuery<TQuery extends Query>(query: Query): QueryExecutor<void[]>
function useQuery<TQuery extends Query>(
  query: TQuery,
  options: QueryOptions
): QueryExecutor<void[]>
function useQuery<TQuery extends Query>(
  query: TQuery,
  callback: QueryCallback<TQuery>
): QueryExecutor<void[]>
function useQuery<TQuery extends Query>(
  query: TQuery,
  dependencies: any[]
): QueryExecutor<void[]>
function useQuery<TQuery extends Query>(
  query: Query,
  callback: QueryCallback<TQuery>,
  dependencies: any[]
): QueryExecutor<void[]>
function useQuery<TQuery extends Query>(
  query: TQuery,
  options: QueryOptions,
  callback: QueryCallback<TQuery>
): QueryExecutor<void[]>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useQuery<TQuery extends Query>(
  query: Query,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<void[]>
function useQuery<TQuery extends Query>(
  query: Query,
  options: QueryOptions,
  callback: QueryCallback<TQuery>,
  dependencies: any[]
): QueryExecutor<void[]>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  callback: QueryCallback<TQuery>
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  callback: QueryCallback<TQuery>,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions,
  callback: QueryCallback<TQuery>
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions,
  callback: QueryCallback<TQuery>,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQuery<TArgs extends any[], TQuery extends Query>(
  query: Query | QueryBuilder<TArgs, TQuery>,
  options?: QueryOptions | QueryCallback<TQuery> | any[],
  callback?: QueryCallback<TQuery> | any[],
  dependencies?: any[]
): QueryExecutor<TArgs> {
  const client = useClient()
  const actualOptions: QueryOptions | undefined = firstOfType<QueryOptions>(
    isOptions,
    options
  )
  const actualCallback: QueryCallback<Query> | undefined = firstOfType<
    QueryCallback<Query>
  >(isCallback, options, callback)
  const actualDependencies = firstOfType<any[]>(
    isDependencies,
    options,
    callback,
    dependencies
  )

  if (typeof query === 'function') {
    if (isDependencies(actualDependencies)) {
      return useCallback(
        (...data: TArgs): Promise<QueryResult> | void =>
          client.query(query(...data), actualOptions, actualCallback),
        [client, ...actualDependencies]
      )
    }
    return (...data: TArgs): Promise<QueryResult> | void =>
      client.query(query(...data), actualOptions, actualCallback)
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
