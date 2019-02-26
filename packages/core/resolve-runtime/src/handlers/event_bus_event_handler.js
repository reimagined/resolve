const handleGetAppConfigEvent = async (lambdaEvent, resolve) => {
  return {
    applicationName: resolve.applicationName,
    readModels: resolve.readModels.map(
      ({ name, projection, resolvers, invariantHash }) => ({
        name,
        eventTypes: Object.keys(projection || {}).filter(
          eventType => eventType !== 'Init'
        ),
        resolverNames: Object.keys(resolvers || {}),
        invariantHash
      })
    ),
    viewModels: resolve.viewModels.map(
      ({ name, projection, invariantHash }) => ({
        name,
        eventTypes: Object.keys(projection || {}).filter(
          eventType => eventType !== 'Init'
        ),
        invariantHash
      })
    ),
    aggregates: resolve.aggregates.map(({ name, commands, invariantHash }) => ({
      name,
      commandTypes: Object.keys(commands || {}),
      invariantHash
    }))
  }
}

const handleApplyEvents = async (lambdaEvent, resolve) => {
  const { events, listenerId } = lambdaEvent

  const executor = resolve.executeQuery.getExecutor(listenerId)

  await executor.updateByEvents(events)

  return true
}

const handleEventBusEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent['detail-type']) {
    case 'GET_APP_CONFIG': {
      return await handleGetAppConfigEvent(lambdaEvent, resolve)
    }
    case 'APPLY_EVENTS_FROM_EVENT_BUS': {
      return await handleApplyEvents(lambdaEvent, resolve)
    }
    default: {
      return null
    }
  }
}

export default handleEventBusEvent
