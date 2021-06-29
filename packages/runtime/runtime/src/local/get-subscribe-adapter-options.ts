import { URL } from 'url'

import getRootBasedUrl from '../common/utils/get-root-based-url'
import jwt from 'jsonwebtoken'

export const getSubscribeAdapterOptions = async (
  thisResolve: any,
  origin: string,
  eventTypes: string[],
  aggregateIds: string[]
) => {
  const token = jwt.sign(
    { eventTypes, aggregateIds },
    thisResolve.applicationName
  )

  const { protocol, hostname, port } = new URL(origin)
  const isSecure = /^https/.test(protocol)
  const targetProtocol = isSecure ? 'wss' : 'ws'
  const targetPath = '/api/websocket'
  const targetPort = port == null ? [80, 443][+isSecure] : port

  const subscribeUrl = `${targetProtocol}://${hostname}:${targetPort}${getRootBasedUrl(
    thisResolve.rootPath,
    targetPath
  )}?kind=viewModel&deploymentId=${thisResolve.applicationName}&token=${token}`

  return {
    appId: thisResolve.applicationName,
    url: subscribeUrl,
  }
}
