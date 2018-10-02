const publish = async (
  { channel, config: { exchange, queueName, messageTtl } },
  event
) => {
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
}

export default publish
