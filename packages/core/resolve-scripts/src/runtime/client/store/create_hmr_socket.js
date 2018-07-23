import socketIOClient from 'socket.io-client'

module.exports = ({ origin, rootPath }) => {
  if (!window.__LOCAL_DEVELOPMENT__) {
    return
  }

  let HMR_ID = null

  const client = socketIOClient(origin, {
    path: `${rootPath ? `/${rootPath}` : ''}/api/hmr`
  })

  client.on('hotModuleReload', message => {
    if (HMR_ID && HMR_ID !== message) {
      window.location.reload(true)
    }
    HMR_ID = message
  })

  client.on('error', () => {})
}
