import amqp from 'amqplib'

const defaultOptions = {
  exchange: 'exchange',
  queueName: '',
  channelName: '',
  exchangeType: 'fanout',
  messageTtl: 2000,
  maxLength: 10000
}

const init = async (
  { url, exchange, exchangeType, queueName, messageTtl, maxLength },
  handler
) => {
  try {
    const connection = await amqp.connect(url)
    const channel = await connection.createChannel()

    await channel.assertExchange(exchange, exchangeType, {
      durable: false
    })

    const queue = await channel.assertQueue(queueName, {
      arguments: {
        messageTtl: messageTtl,
        maxLength: maxLength
      }
    })

    await channel.bindQueue(queue.queue, exchange)

    await channel.consume(
      queueName,
      msg => {
        if (msg) {
          const content = msg.content.toString()
          const message = JSON.parse(content)
          handler(message)
        }
      },
      { noAck: true }
    )

    return channel
  } catch (e) {
    e.name = `RabbitMQ message bus error`
    throw e
  }
}

function createAdapter(options) {
  let handler = () => {}
  const config = { ...defaultOptions, ...options }
  let initPromise = null
  const { exchange, queueName, messageTtl } = config

  return {
    init: () => {
      initPromise = init(config, event => handler(event))
      return initPromise
    },
    publish: async event => {
      const channel = await initPromise

      if (!channel) {
        return
      }

      return channel.publish(
        exchange,
        queueName,
        new Buffer(JSON.stringify(event)),
        // Additional options described here:
        // http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
        {
          expiration: messageTtl,
          persistent: false
        }
      )
    },
    subscribe: callback => (handler = callback)
  }
}

export default createAdapter
