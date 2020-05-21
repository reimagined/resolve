const setProperty = async (req, res) => {
  let { listenerId, key, value } = req.query
  await req.resolve.publisher.setProperty({
    eventSubscriber: listenerId,
    key: String(key),
    value: String(value)
  })
  res.end(`ListenerId = "${listenerId}", Key = "${key}", Value = "${value}"`)
}

export default setProperty
