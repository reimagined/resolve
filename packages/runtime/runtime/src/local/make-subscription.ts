import { URL } from 'url'

import getRootBasedUrl from '../common/utils/get-root-based-url'
import jwt from 'jsonwebtoken'

export type ViewModelSubscriptionParams = {
  eventTypes: string[]
  aggregateIds: string | string[] | undefined
}

export type ReadModelSubscriptionParams = {
  channel: string
  permit: string
}

const isReadModelSubscriptionParams = (
  subscription: any
): subscription is ReadModelSubscriptionParams => subscription.channel != null

const makeViewModelSubscription = (
  thisResolve: any,
  baseUrl: string,
  subscription: ViewModelSubscriptionParams
) => {
  const { eventTypes, aggregateIds: rawAggregateIds } = subscription

  const aggregateIds =
    Array.isArray(rawAggregateIds) ||
    rawAggregateIds === '*' ||
    rawAggregateIds == null
      ? rawAggregateIds
      : [rawAggregateIds]

  const token = jwt.sign(
    { eventTypes, aggregateIds },
    thisResolve.applicationName
  )

  return {
    url: `${baseUrl}?kind=viewModel&deploymentId=${thisResolve.applicationName}&token=${token}`,
  }
}

const makeReadModelSubscription = (
  thisResolve: any,
  baseUrl: string,
  subscription: ReadModelSubscriptionParams
) => {
  const { channel, permit } = subscription

  return {
    url: `${baseUrl}?kind=readModel&channel=${channel}&permit=${permit}`,
  }
}

export const makeSubscription = async (
  thisResolve: any,
  origin: string,
  subscription: ViewModelSubscriptionParams | ReadModelSubscriptionParams
) => {
  const { protocol, hostname, port } = new URL(origin)
  const isSecure = /^https/.test(protocol)
  const targetProtocol = isSecure ? 'wss' : 'ws'
  const targetPath = '/api/websocket'
  const targetPort = port == null ? [80, 443][+isSecure] : port

  const baseUrl = `${targetProtocol}://${hostname}:${targetPort}${getRootBasedUrl(
    thisResolve.rootPath,
    targetPath
  )}`

  if (isReadModelSubscriptionParams(subscription)) {
    return makeReadModelSubscription(thisResolve, baseUrl, subscription)
  } else {
    return makeViewModelSubscription(thisResolve, baseUrl, subscription)
  }
}
