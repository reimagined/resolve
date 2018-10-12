import RabbitMQBusError from './rabbitmq-error'

const init = async (amqp, pool, onMessage) => {
  try {
    const {
      url,
      exchange,
      exchangeType,
      queueName,
      messageTtl,
      maxLength
    } = pool.config

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

    await channel.consume(queueName, onMessage, {
      noAck: true
    })

    Object.assign(pool, {
      connection,
      channel,
      queue
    })
  } catch (error) {
    throw new RabbitMQBusError(error.message, error.stack, error.cause)
  }
}

export default init
