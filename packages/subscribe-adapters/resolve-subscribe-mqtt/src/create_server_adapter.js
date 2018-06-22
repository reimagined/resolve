import { Server as WebSocketServer } from 'ws'

import createServerHandler from './create_server_adapter'

const createServerAdapter = ({ server, path, pubsubManager }) => {
  const socketMqttServer = new WebSocketServer({
    server,
    path
  })
  
  const handler = createServerHandler({ pubsubManager })
  
  socketMqttServer.on('connection', handler)
  
  return {
    init() {
    },
    
    close() {
    }
  }
}

export default createServerAdapter
