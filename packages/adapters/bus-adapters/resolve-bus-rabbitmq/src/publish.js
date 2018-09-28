const publish = async({ channel, config: { exchange, queueName, messageTtl }, onEvent }, event)=> {
  await channel.publish(
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
  
  // TODO check double event
  await onEvent(event)
}

export default publish
