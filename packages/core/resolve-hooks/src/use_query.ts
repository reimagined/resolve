import React, { useEffect, useContext, useCallback } from 'react'

import {
  getApi,
  Query,
  QueryOptions,
  QueryCallback,
  QueryResult
} from 'resolve-api'

import { ResolveContext } from './context'

const useQuery = (
  qr: Query,
  queryOptions?: QueryOptions | QueryCallback,
  queryCallback?: QueryCallback
): [Promise<QueryResult> | void, Function] => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use resolve effects outside Resolve context')
  }

  const api = getApi(context)

  let queryResult
  const get = useCallback(async () => {
    queryResult = await api.query(qr, queryOptions, queryCallback)
  }, [qr, queryOptions, queryCallback])

  return [queryResult, get]
}

export { useQuery }
