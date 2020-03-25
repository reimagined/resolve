import { Query, QueryOptions, QueryResult, QueryCallback } from 'resolve-client'
import { useCallback } from 'react'
import {
  firstOfType,
  HookExecutor,
  isCallback,
  isDependencies,
  isOptions
} from './generic'
import { useClient } from './use_client'

type QueryBuilder<T> = (data: T) => Query
type QueryExecutor<T> = HookExecutor<T, QueryResult>

function useQueryBuilder<T>(builder: QueryBuilder<T>): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions
): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  callback: QueryCallback
): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  dependencies: any[]
): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions,
  callback: QueryCallback
): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<T>
function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
  options: QueryOptions,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor<T>

function useQueryBuilder<T>(
  builder: QueryBuilder<T>,
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
  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, callback, dependencies) ??
    [builder, actualOptions, actualCallback].filter(i => i)

  return useCallback(
    (data: T): Promise<QueryResult> | void =>
      client.query(builder(data), actualOptions, actualCallback),
    [client, ...actualDependencies]
  )
}

export { useQueryBuilder }
