import { Server as WebSocketServer } from 'ws'

import createServerHandler from './create_server_handler'
import { errorMessageNotInitialized, errorMessageAlreadyInitialized } from './constants'

const createServerAdapter = ({ server, getRootBasedUrl, pubsubManager }) => {
  let isInitialized = false
  let socketMqttServer = null
  
  return {
    async init() {
      if(isInitialized) {
        throw new Error(errorMessageAlreadyInitialized)
      }
  
      isInitialized = true
    
      return new Promise((resolve, reject) => {
        socketMqttServer = new WebSocketServer({
          server,
          path: getRootBasedUrl('/mqtt')
        }, (error) => error ? reject(error) : resolve())
    
        const handler = createServerHandler({ pubsubManager })
    
        socketMqttServer.on('connection', handler)
      })
    },
  
    async close() {
      if (!isInitialized) {
        throw new Error(errorMessageNotInitialized)
      }
      
      return new Promise((resolve, reject) => {
        socketMqttServer.close(
          (error) => error ? reject(error) : resolve()
        );
  
        socketMqttServer = null
  
        isInitialized = false
      })
    }
  }
}

export default createServerAdapter
