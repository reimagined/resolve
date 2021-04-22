import wrapApiHandler from './wrap-api-handler'

const sagasList = async (req, res) => {
  const statuses = []

  for (const name of [
    ...req.resolve.domain.sagas,
    ...req.resolve.domainInterop.sagaDomain.getSagasSchedulersInfo(),
  ].map((saga) => saga.name)) {
    const eventSubscriber = `${name}`

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

export default wrapApiHandler(sagasList)
