const publish = async (pool, event) => {
  const message = `${pool.config.channel} ${JSON.stringify(event)}`
  pool.pubSocket.send(message)
}

export default publish
