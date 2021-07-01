import { useCallback, useMemo } from 'react'
import {
  QueryOptions,
  QueryResult,
  ReadModelQuery,
  ReadModelSubscription,
} from '@resolve-js/client'
import { useClient } from './use-client'
import { isOptions } from './generic'
import { firstOfType } from '@resolve-js/core'

export type ReadModelChannelQueryResultCallback = (result: QueryResult) => void
export type ReadModelChannelNotificationCallback = (notification: any) => void
export type ReadModelChannelHook = {
  connect: () => void
  dispose: () => void
}

function useReadModelChannel(
  query: ReadModelQuery,
  dependencies: any[],
  notificationCallback: ReadModelChannelNotificationCallback,
  queryResultCallback?: ReadModelChannelQueryResultCallback | QueryOptions,
  options?: QueryOptions
): ReadModelChannelHook {
  const client = useClient()

  const actualOptions: QueryOptions | undefined = firstOfType<QueryOptions>(
    isOptions,
    queryResultCallback,
    options
  )

  const memo: any = useMemo(() => ({}), dependencies)

  memo.notificationCallback = notificationCallback

  let subscription: ReadModelSubscription
  let connected = false

  const connect = useCallback(() => {
    if (connected) {
      throw Error(
        `duplicate connect call, maybe incorrect useEffect dependencies`
      )
    }

    connected = true

    client.query(query, actualOptions, (error, result) => {
      if (error) {
        throw error
      }
      if (!result) {
        throw Error(`no query result`)
      }

      const url = result.meta?.url
      const channelPermit = result.meta?.channelPermit

      if (url == null || url === '' || channelPermit == null) {
        throw Error(
          `query result does not includes channel permit or subscription URL`
        )
      }

      if (typeof queryResultCallback === 'function') {
        queryResultCallback(result)
      }

      client.subscribe(
        {
          url,
          readModelName: query.name,
          channel: channelPermit.channel,
        },
        (notification) => memo.notificationCallback(notification),
        (error, sub) => {
          if (error != null) {
            throw error
          }
          if (sub == null) {
            throw Error('no subscription data returned')
          }
          subscription = sub as ReadModelSubscription
        }
      )
    })
  }, dependencies)
  const dispose = useCallback(() => {
    if (subscription != null) {
      client.unsubscribe(subscription)
    }
  }, dependencies)

  return { connect, dispose }
}

export { useReadModelChannel }
