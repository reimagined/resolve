import React, { useEffect, useContext } from 'react'

import {
  getApi,
  SubscribeCallback,
  SubscribeHandler,
  ResubscribeCallback,
  Subscription
} from 'resolve-client'

import { ResolveContext } from './context'

const useSubscription = (
  viewModelName: string,
  aggregateIds: Array<string> | '*',
  onEvent: SubscribeHandler,
  onSubscribe?: SubscribeCallback,
  onResubscribe?: ResubscribeCallback
): void => {
  const context = useContext(ResolveContext)
  if (!context) {
    throw Error('You cannot use resolve effects outside Resolve context')
  }
  const { viewModels } = context
  const api = getApi(context)

  useEffect(() => {
    const viewModel = viewModels.find(
      ({ name }: { name: string }) => name === viewModelName
    )

    if (!viewModel) {
      return undefined
    }

    let subscription: Subscription | null
    const onSubscribeCallback = (
      err: Error | null,
      result: Subscription | null
    ): void => {
      if (!err) {
        subscription = result
      }

      if (typeof onSubscribe === 'function') {
        onSubscribe(err, result)
      }
    }

    api.subscribeTo(
      viewModelName,
      aggregateIds,
      onEvent,
      onSubscribeCallback,
      onResubscribe
    )

    return (): void => {
      console.log('use_subcription: unmount, subscription:', subscription)
      if (!viewModel) {
        return
      }
      if (subscription) {
        console.log('use_subcription: unsubscribe')
        api.unsubscribe(subscription)
      }
    }
  }, [onEvent, onSubscribe, onResubscribe])
}

export { useSubscription }
