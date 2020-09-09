const getProperty = async (req, res) => {
  const { listenerId, key } = req.query
  const value = await req.resolve.eventBus.getProperty({
    eventSubscriber: listenerId,
    key,
  })
  res.end(`ListenerId = "${listenerId}", Key = "${key}", Value = "${value}"`)
}

export default getProperty
