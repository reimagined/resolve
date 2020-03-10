import React, { useState, useEffect, useContext, useCallback } from 'react'

import {
  getApi,
  Query,
  QueryOptions,
  QueryCallback,
  QueryResult
} from 'resolve-client'

import { ResolveContext } from './context'

const useQuery = (
  qr: Query,
  queryOptions?: QueryOptions | QueryCallback,
  queryCallback?: QueryCallback
): [QueryResult | undefined, Function] => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use resolve effects outside Resolve context')
  }

  const api = getApi(context)
  const [data, setData] = useState<QueryResult>()

  const requestModel = useCallback(async () => {
    const result = await api.query(qr, queryOptions, queryCallback)
    if (result) {
      setData(() => result)
    }
  }, [qr, queryOptions, queryCallback])

  useEffect(() => {
    requestModel()
  }, [])

  return [data, requestModel]
}

export { useQuery }
