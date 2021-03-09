import wrapApiHandler from './wrap-api-handler'

const readModelList = async (req, res) => {
  const statusPromises = []
  for (const { name: eventSubscriber } of req.resolve.readModels) {
    statusPromises.push(req.resolve.eventSubscriber.status({ eventSubscriber }))
  }
  const statuses = await Promise.all(statusPromises)

  await res.json(statuses)
}

export default wrapApiHandler(readModelList)
