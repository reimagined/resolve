import Url from 'url'
import partial from 'lodash.partial'

import { getRootBasedUrl } from '@resolve-js/core'
import jwt from 'jsonwebtoken'
import { ReactiveSubscription } from '../common'

type ReactiveSubscriptionRuntime = {
  applicationName: string
  rootPath: string
}

const getReactiveSubscription = async (
  context: ReactiveSubscriptionRuntime,
  origin: string,
  eventTypes: string[] | null,
  aggregateIds: string[] | null
): Promise<ReactiveSubscription> => {
  const { applicationName, rootPath } = context

  const token = jwt.sign({ eventTypes, aggregateIds }, applicationName)

  const { protocol, hostname, port } = Url.parse(origin)
  const isSecure = /^https/.test(protocol as string)
  const targetProtocol = isSecure ? 'wss' : 'ws'
  const targetPath = '/api/websocket'
  const targetPort = port == null ? [80, 443][+isSecure] : port

  const subscribeUrl = `${targetProtocol}://${hostname}:${targetPort}${getRootBasedUrl(
    rootPath,
    targetPath
  )}?deploymentId=${applicationName}&token=${token}`

  return {
    appId: applicationName,
    url: subscribeUrl,
  }
}

export const getReactiveSubscriptionFactory = (
  context: ReactiveSubscriptionRuntime
) => partial(getReactiveSubscription, context)
