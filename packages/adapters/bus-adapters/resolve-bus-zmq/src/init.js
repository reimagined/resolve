import ZeroMQBusError from './zmq-error'

const init = async (zmq, pool, onMessage) => {
  const { subAddress, pubAddress, channel } = pool.config

  await new Promise(async (resolve, reject) => {
    try {
      pool.xsubSocket = zmq.socket('xsub')
      pool.xsubSocket.identity = `subscriber${process.pid}`
      pool.xsubSocket.bindSync(subAddress)

      pool.xpubSocket = zmq.socket('xpub')
      pool.xpubSocket.identity = `publisher${process.pid}`

      // ZMQ parameters described here http://api.zeromq.org/3-3:zmq-setsockopt
      pool.xpubSocket.setsockopt(zmq.ZMQ_SNDHWM, 1000)
      pool.xpubSocket.setsockopt(zmq.ZMQ_XPUB_VERBOSE, 0)
      pool.xpubSocket.bindSync(pubAddress)

      pool.xsubSocket.on('message', data => pool.xpubSocket.send(data))
      pool.xpubSocket.on('message', data => pool.xsubSocket.send(data))
    } catch (e) {}

    try {
      pool.pubSocket = zmq.socket('pub')
      await pool.pubSocket.connect(subAddress)

      pool.subSocket = zmq.socket('sub')
      await pool.subSocket.subscribe(channel)
      await pool.subSocket.connect(pubAddress)

      pool.subSocket.on('message', onMessage)

      resolve()
    } catch (e) {
      reject(new ZeroMQBusError(e.message, e.cause))
    }
  })
}

export default init
