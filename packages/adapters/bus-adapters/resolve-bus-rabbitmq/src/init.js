import RabbitMQBusError from './rabbitmq-error'

const init = async (amqp, pool) => {
  try {
    const { url, exchange, exchangeType, queueName, messageTtl, maxLength } = pool.config
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
      async message => {
        if (message) {
          const content = message.content.toString()
          const event = JSON.parse(content)
  
          pool.onEvent(event)
          // await Promise.resolve()
          // await Promise.all(
          //   Array.from(pool.handlers).map(
          //     handler => handler(event)
          //   )
          // )
        }
      },
      { noAck: true }
    )
    
    pool.connection = connection
    pool.channel = channel
  } catch (e) {
    throw new RabbitMQBusError(e.message, e.cause)
  }
}

export default init