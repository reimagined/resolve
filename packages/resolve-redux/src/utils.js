export const getRootBasedUrl = (origin, rootPath, url) => {
  return `${origin}${rootPath ? `/${rootPath}` : ''}${url}`
}

export const getKey = (viewModel, aggregateId) => {
  return `${viewModel}:${aggregateId}`
}

export const delay = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export const getEventTypes = (viewModels, subscribers) => {
  const eventTypes = {}

  Object.keys(subscribers.viewModels).forEach(viewModelName => {
    if (!subscribers.viewModels[viewModelName]) {
      return
    }

    const projection = {
      ...viewModels.find(({ name }) => name === viewModelName).projection
    }
    delete projection.Init

    Object.keys(projection).forEach(eventType => {
      eventTypes[eventType] = true
    })
  })

  return Object.keys(eventTypes)
}

export const getAggregateIds = (viewModels, subscribers) => {
  if (subscribers.aggregateIds['*'] > 0) {
    return '*'
  }

  return Object.keys(subscribers.aggregateIds).filter(
    aggregateId => subscribers.aggregateIds[aggregateId]
  )
}
