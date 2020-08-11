import Url from 'url'

import getRootBasedUrl from '../common/utils/get-root-based-url'
import jwt from 'jsonwebtoken'

const getSubscribeAdapterOptions = async (
  resolve,
  origin,
  viewModelName,
  topics,
  authToken
) => {
  const viewModel = resolve.viewModels.find(vw => vw.name === viewModelName)

  if (viewModel == null) {
    throw new Error('View model is not found')
  }

  const customTopics = await viewModel.resolver(resolve, {
    topics,
    jwt: authToken
  })

  const token = jwt.sign({ topics: customTopics }, resolve.applicationName)

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
    url: subscribeUrl
  }
}

export default getSubscribeAdapterOptions
