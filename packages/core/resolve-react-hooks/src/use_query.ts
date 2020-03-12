import {
  getClient,
  Query,
  QueryOptions,
  QueryResult,
  QueryCallback
} from 'resolve-client'
import { useContext, useCallback } from 'react'
import { ResolveContext } from './context'
import {
  firstOfType,
  HookExecutor,
  isCallback,
  isDependencies,
  isOptions
} from './generic'

type QueryExecutor = HookExecutor<void, QueryResult>

function useQuery(query: Query): QueryExecutor
function useQuery(query: Query, options: QueryOptions): QueryExecutor
function useQuery(query: Query, callback: QueryCallback): QueryExecutor
function useQuery(query: Query, dependencies: any[]): QueryExecutor
function useQuery(
  query: Query,
  options: QueryOptions,
  callback: QueryCallback
): QueryExecutor
function useQuery(
  query: Query,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor
function useQuery(
  query: Query,
  options: QueryOptions,
  callback: QueryCallback,
  dependencies: any[]
): QueryExecutor

function useQuery(
  query: Query,
  options?: QueryOptions | QueryCallback | any[],
  callback?: QueryCallback | any[],
  dependencies?: any[]
): QueryExecutor {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use reSolve hooks outside Resolve context')
  }
  const client = getClient(context)
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
    [query, actualOptions, actualCallback].filter(i => i)

  return useCallback(
    (): Promise<QueryResult> | void =>
      client.query(query, actualOptions, actualCallback),
    [context, ...actualDependencies]
  )
}

export { useQuery }
