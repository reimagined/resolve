import wrapApiHandler from './wrap-api-handler'

const getProperty = async (req, res) => {
  const { eventSubscriber, key } = req.query
  const value = await req.resolve.eventBus.getProperty({
    eventSubscriber,
    key,
  })
  res.end(
    `EventSubscriber = "${eventSubscriber}", Key = "${key}", Value = "${value}"`
  )
}

export default wrapApiHandler(getProperty)
