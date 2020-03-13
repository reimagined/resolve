import React, { useEffect, useContext, useCallback } from 'react'

import {
  getClient,
  SubscribeCallback,
  ResubscribeCallback,
  Subscription
} from 'resolve-client'

import { ResolveContext } from './context'
type SubscriptionOptions = {
  viewModelName: string
  aggregateIds: Array<string> | '*'
  onSubscribe?: SubscribeCallback
}

const useSubscription = (options: SubscriptionOptions): any | undefined => {
  const { viewModelName, aggregateIds, onSubscribe } = options

  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use resolve effects outside Resolve context')
  }
  const { viewModels } = context
  const client = getClient(context)

  const viewModel = viewModels.find(
    ({ name }: { name: string }) => name === viewModelName
  )

  if (!viewModel) {
    return undefined
  }

  let subscription: Subscription | null
  const onSubscribeCallback = useCallback(
    (err: Error | null, result: Subscription | null): void => {
      if (!err) {
        subscription = result
      }

      if (typeof onSubscribe === 'function') {
        onSubscribe(err, result)
      }
    },
    [onSubscribe]
  )

  const subscriptions = {
    onEvent: (event: any): any => {},
    onResubscribe: (event: any): any => {}
  }

  return {
    subscribe: useCallback(
      (): Promise<Subscription> | void =>
        client.subscribeTo(
          viewModelName,
          aggregateIds,
          event => subscriptions.onEvent(event),
          onSubscribeCallback,
          event => subscriptions.onResubscribe(event)
        ),
      []
    ),
    unsubscribe: useCallback((): void => {
      if (subscription) {
        client.unsubscribe(subscription)
      }
    }, []),
    setEventHandler: useCallback((handler: any): any => {
      subscriptions.onEvent = handler
    }, []),
    setResubscribeHandler: useCallback((handler: any): any => {
      subscriptions.onResubscribe = handler
    }, [])
  }
}

export { useSubscription }
