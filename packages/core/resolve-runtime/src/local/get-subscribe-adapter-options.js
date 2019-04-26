import Url from 'url'

import getRootBasedUrl from '../common/utils/get-root-based-url'

const getSubscribeAdapterOptions = async (resolve, origin, adapterName) => {
  if (adapterName !== 'mqtt' && adapterName !== 'socket.io') {
    return null
  }

  const { protocol, hostname, port } = Url.parse(origin)
  const isMqtt = adapterName === 'mqtt'
  const isSecure = /^https/.test(protocol)
  const targetProtocol = ['http', 'https', 'ws', 'wss'][isMqtt * 2 + isSecure]
  const targetPath = isMqtt ? '/api/mqtt' : '/api/socket-io/'
  const targetPort = port == null ? [80, 443][+isSecure] : port

  const url = `${targetProtocol}://${hostname}:${targetPort}${getRootBasedUrl(
    resolve.rootPath,
    targetPath
  )}`

  return {
    appId: resolve.applicationName,
    url
  }
}

export default getSubscribeAdapterOptions
