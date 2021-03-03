import { QueryOptions, QueryCallback, Query } from '@resolve-js/client'
import { QueryBuilder, QueryExecutor, useQuery } from './use-query'

function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  callback: QueryCallback<TQuery>
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  callback: QueryCallback<TQuery>,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions,
  callback: QueryCallback<TQuery>
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions,
  dependencies: any[]
): QueryExecutor<TArgs>
function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options: QueryOptions,
  callback: QueryCallback<TQuery>,
  dependencies: any[]
): QueryExecutor<TArgs>

function useQueryBuilder<TArgs extends any[], TQuery extends Query>(
  builder: QueryBuilder<TArgs, TQuery>,
  options?: QueryOptions | QueryCallback<TQuery> | any[],
  callback?: QueryCallback<TQuery> | any[],
  dependencies?: any[]
): QueryExecutor<TArgs> {
  return useQuery(builder, options as any, callback as any, dependencies as any)
}
export { useQueryBuilder }
