import { QueryOptions, QueryCallback } from 'resolve-client'
import { QueryBuilder, QueryExecutor, useQuery } from './use-query'

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
  return useQuery(builder, options as any, callback as any, dependencies as any)
}
export { useQueryBuilder }
