export const checkRequiredFields = (obj, beforeWarnings, afterWarnings) => {
  const warningMessages = Object.keys(obj)
    .map(
      fieldName =>
        obj[fieldName] ? null : `The '${fieldName}' field is required`
    )
    .filter(msg => msg)

  const shouldWarningsBePrinted = warningMessages.length > 0

  if (shouldWarningsBePrinted) {
    // eslint-disable-next-line no-console
    console.warn(
      [beforeWarnings, ...warningMessages, afterWarnings]
        .filter(line => line)
        .join('\n')
    )
  }

  return !shouldWarningsBePrinted
}

export const getRootBasedUrl = (origin, rootPath, url) => {
  return `${origin}${rootPath ? `/${rootPath}` : ''}${url}`
}

export const getKey = (viewModel, aggregateId) => {
  return `${viewModel}:${aggregateId}`
}

export const delay = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

export const makeLateResolvingPromise = (...args) => {
  if (args.length > 1) {
    throw new Error(
      'Make late-resolved promise accepts only zero on one argument'
    )
  }

  let resolvePromise = null
  const promise = new Promise(resolve => (resolvePromise = resolve))
  Object.defineProperty(promise, 'resolve', { value: resolvePromise })

  if (args.length === 1) {
    resolvePromise(args[0])
  }

  return promise
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

export const createOrderedFetch = () => {
  let orderedFetchPromise = Promise.resolve()

  return (url, options) =>
    new Promise(resolveResult => {
      orderedFetchPromise = orderedFetchPromise.then(async () => {
        while (true) {
          try {
            return resolveResult(await fetch(url, options))
          } catch (err) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      })
    })
}
