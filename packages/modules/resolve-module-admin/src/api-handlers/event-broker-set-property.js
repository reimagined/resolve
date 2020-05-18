const setProperty = async (req, res) => {
  let { listenerId, key, value } = req.query
  await req.resolve.publisher.setProperty(
    listenerId,
    String(key),
    String(value)
  )
  res.end(`ListenerId = "${listenerId}", Key = "${key}", Value = "${value}"`)
}

export default setProperty
