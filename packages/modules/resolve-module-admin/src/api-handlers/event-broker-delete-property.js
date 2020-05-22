const deleteProperty = async (req, res) => {
  const { listenerId, key } = req.query
  await req.resolve.publisher.deleteProperty({
    eventSubscriber: listenerId,
    key
  })
  res.end(`ListenerId = "${listenerId}", Key = "${key}" deleted`)
}

export default deleteProperty
