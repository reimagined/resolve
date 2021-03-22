import Url from 'url'

import getRootBasedUrl from '../common/utils/get-root-based-url'
import jwt from 'jsonwebtoken'

const getSubscribeAdapterOptions = async (
  resolve,
  origin,
  eventTypes,
  aggregateIds
) => {
  const token = jwt.sign({ eventTypes, aggregateIds }, resolve.applicationName)

  const { protocol, hostname, port } = Url.parse(origin)
  const isSecure = /^https/.test(protocol)
  const targetProtocol = isSecure ? 'wss' : 'ws'
  const targetPath = '/api/websocket'
  const targetPort = port == null ? [80, 443][+isSecure] : port

  const subscribeUrl = `${targetProtocol}://${hostname}:${targetPort}${getRootBasedUrl(
    resolve.rootPath,
    targetPath
  )}?deploymentId=${resolve.applicationName}&token=${token}`

  return {
    appId: resolve.applicationName,
    url: subscribeUrl,
  }
}

export default getSubscribeAdapterOptions
