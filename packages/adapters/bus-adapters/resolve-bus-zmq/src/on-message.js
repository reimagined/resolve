const onMessage = async (pool, message) => {
  await Promise.resolve()
  try {
    const data = message.toString().substring(pool.config.channel.length + 1)
    const event = JSON.parse(data)

    await Promise.all(Array.from(pool.handlers).map(handler => handler(event)))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default onMessage
