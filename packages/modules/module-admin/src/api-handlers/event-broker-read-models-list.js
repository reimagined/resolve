import wrapApiHandler from './wrap-api-handler'

const readModelList = async (req, res) => {
  const statuses = []

  for (const { name: eventSubscriber } of req.resolve.readModels) {
    try {
      const response = await req.resolve.eventSubscriber.status({
        eventSubscriber,
      })

      statuses.push(response)
    } catch (error) {
      statuses.push({
        eventSubscriber,
        status: 'error',
        errors: [
          {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
          },
        ],
      })
    }
  }

  await res.json(statuses)
}

export default wrapApiHandler(readModelList)
