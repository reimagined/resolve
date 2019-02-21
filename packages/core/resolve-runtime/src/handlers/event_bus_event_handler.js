const handleGetAppConfigEvent = async (lambdaEvent, resolve) => {
  return {
    readModels: resolve.readModels.map(({ name, projection, resolvers }) => ({
      name,
      eventTypes: Object.keys(projection || {}).filter(
        eventType => eventType !== 'Init'
      ),
      resolverNames: Object.keys(resolvers || {})
    })),
    viewModels: resolve.viewModels.map(({ name, projection }) => ({
      name,
      eventTypes: Object.keys(projection || {}).filter(
        eventType => eventType !== 'Init'
      )
    })),
    aggregates: resolve.aggregates.map(({ name, commands }) => ({
      name,
      commandTypes: Object.keys(commands || {})
    }))
  }
}

const handleEventBusEvent = async (lambdaEvent, resolve) => {
  switch (lambdaEvent['detail-type']) {
    case 'GET_APP_CONFIG': {
      return await handleGetAppConfigEvent(lambdaEvent, resolve)
    }
    case 'LISTEN_EVENT_BUS': {
      // eslint-disable-next-line no-console
      console.log('LISTEN_EVENT_BUS', lambdaEvent)
      break
    }
    case 'PAUSE_EVENT_BUS': {
      // eslint-disable-next-line no-console
      console.log('PAUSE_EVENT_BUS', lambdaEvent)
      break
    }
    default: {
      return null
    }
  }
}

export default handleEventBusEvent
