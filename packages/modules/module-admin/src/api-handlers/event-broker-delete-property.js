import wrapApiHandler from './wrap-api-handler'

const deleteProperty = async (req, res) => {
  const { eventSubscriber, key } = req.query
  await req.resolve.eventSubscriber.deleteProperty({
    eventSubscriber,
    key,
  })
  res.end(`EventSubscriber = "${eventSubscriber}", Key = "${key}" deleted`)
}

export default wrapApiHandler(deleteProperty)
