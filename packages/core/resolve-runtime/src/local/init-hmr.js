import uuid from 'uuid/v4'
import createSocketServer from 'socket.io'

import getRootBasedUrl from '../common/utils/get-root-based-url'

const initHMR = async resolve => {
  const HMR_ID = uuid()

  const HMRSocketHandler = socket => {
    socket.emit('hotModuleReload', HMR_ID)
  }

  const HMRSocketServer = createSocketServer(resolve.server, {
    path: getRootBasedUrl(resolve.rootPath, '/api/hmr/'),
    serveClient: false
  })

  HMRSocketServer.on('connection', HMRSocketHandler)
}

export default initHMR
