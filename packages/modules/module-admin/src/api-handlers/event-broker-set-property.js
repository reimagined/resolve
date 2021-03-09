import wrapApiHandler from './wrap-api-handler'

const setProperty = async (req, res) => {
  let { eventSubscriber, key, value } = req.query
  await req.resolve.eventSubscriber.setProperty({
    eventSubscriber,
    key: String(key),
    value: String(value),
  })
  res.end(
    `EventSubscriber = "${eventSubscriber}", Key = "${key}", Value = "${value}"`
  )
}

export default wrapApiHandler(setProperty)
