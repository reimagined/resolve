import wrapApiHandler from './wrap-api-handler'

const listProperties = async (req, res) => {
  const { eventSubscriber } = req.query
  const listProperties = await req.resolve.eventSubscriber.listProperties({
    eventSubscriber,
  })
  res.json(listProperties)
}

export default wrapApiHandler(listProperties)
