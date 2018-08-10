import zmq from 'zeromq'

const defaultOptions = {
  channel: 'DEFAULT',
  address: '127.0.0.1',
  pubPort: 2110,
  subPort: 2111
}

class ZeroMQBusError extends Error {
  constructor(message, cause) {
    super()
    this.name = 'ZeroMQ Bus Error'
    this.message = message

    if (cause) {
      this.cause = cause
    }
  }
}

function createAdapter(options) {
  let handler = () => {}
  const config = { ...defaultOptions, ...options }
  let initPromise = null
  let pubSocket
  let subSocket
  let xpubSocket
  let xsubSocket
  const { address, subPort, pubPort, channel } = config
  const pubAddress = `tcp://${address}:${pubPort}`
  const subAddress = `tcp://${address}:${subPort}`

  return {
    init: async () => {
      if (!initPromise) {
        initPromise = new Promise(async (resolve, reject) => {
          try {
            xsubSocket = zmq.socket('xsub')
            xsubSocket.identity = `subscriber${process.pid}`
            xsubSocket.bindSync(subAddress)

            xpubSocket = zmq.socket('xpub')
            xpubSocket.identity = `publisher${process.pid}`

            // ZMQ parameters described here http://api.zeromq.org/3-3:zmq-setsockopt
            xpubSocket.setsockopt(zmq.ZMQ_SNDHWM, 1000)
            xpubSocket.setsockopt(zmq.ZMQ_XPUB_VERBOSE, 0)
            xpubSocket.bindSync(pubAddress)

            xsubSocket.on('message', data => xpubSocket.send(data))
            xpubSocket.on('message', data => xsubSocket.send(data))
          } catch (e) {}

          try {
            pubSocket = zmq.socket('pub')
            await pubSocket.connect(subAddress)

            subSocket = zmq.socket('sub')
            await subSocket.subscribe(channel)
            await subSocket.connect(pubAddress)

            subSocket.on('message', message => {
              const data = message.toString().substring(channel.length + 1)
              handler(JSON.parse(data))
            })

            resolve()
          } catch (e) {
            reject(new ZeroMQBusError(e.message, e.cause))
          }
        })
      }

      try {
        return await initPromise
      } catch (e) {
        initPromise = null
        throw e
      }
    },
    close: async () => {
      if (!initPromise) {
        throw new ZeroMQBusError('Adapter is not initialized')
      }

      if (xpubSocket) {
        xpubSocket.unbindSync(pubAddress)
      }

      if (xsubSocket) {
        xsubSocket.unbindSync(subAddress)
      }

      subSocket.disconnect(pubAddress)
      pubSocket.disconnect(pubAddress)
      initPromise = null
    },
    publish: async event => {
      if (!initPromise) {
        throw new ZeroMQBusError('Adapter is not initialized')
      }

      await initPromise
      const message = `${channel} ${JSON.stringify(event)}`
      pubSocket.send(message)
    },
    subscribe: async callback => {
      if (!initPromise) {
        throw new ZeroMQBusError('Adapter is not initialized')
      }

      await initPromise
      handler = callback
    }
  }
}

export default createAdapter
