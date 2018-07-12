import uuid from 'uuid/v4'

const HMR_ID = uuid()

const HMRSocketHandler = socket => {
  socket.emit('hotModuleReload', HMR_ID)
}

export default HMRSocketHandler
