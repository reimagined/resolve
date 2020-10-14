import { QueryOptions, QueryCallback, Query } from 'resolve-client'
import { QueryBuilder, QueryExecutor, useQuery } from './use-query'

function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  options: QueryOptions
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  callback: QueryCallback<R>
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  dependencies: any[]
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  callback: QueryCallback<R>,
  dependencies: any[]
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  options: QueryOptions,
  callback: QueryCallback<R>
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<T>
function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  options: QueryOptions,
  callback: QueryCallback<R>,
  dependencies: any[]
): QueryExecutor<T>

function useQueryBuilder<T, R extends Query>(
  builder: QueryBuilder<T, R>,
  options?: QueryOptions | QueryCallback<R> | any[],
  callback?: QueryCallback<R> | any[],
  dependencies?: any[]
): QueryExecutor<T> {
  return useQuery(builder, options as any, callback as any, dependencies as any)
}
export { useQueryBuilder }
