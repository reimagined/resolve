const onMessage = async (pool, message) => {
  if (
    !message ||
    !message.content ||
    typeof message.content.toString !== 'function'
  ) {
    return
  }

  const content = message.content.toString()
  const event = JSON.parse(content)

  await Promise.resolve()
  try {
    await Promise.all(Array.from(pool.handlers).map(handler => handler(event)))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

export default onMessage
