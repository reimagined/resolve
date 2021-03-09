const notifyEventSubscriber = async (resolve, destination) => {
  // TODO notify foreign event subscribers
  void resolve
  void destination
}

const notifyEventSubscribers = async (resolve) => {
  const maxDuration = Math.max(resolve.getVacantTimeInMillis() - 15000, 0)
  let timerId = null

  const timerPromise = new Promise((resolve) => {
    timerId = setTimeout(resolve, maxDuration)
  })

  const inlineLedgerPromise = (async () => {
    const promises = []
    for (const { name: eventListener } of resolve.eventListeners.values()) {
      promises.push(resolve.invokeEventSubscriberAsync(eventListener, 'build'))
    }

    const eventSubscribers = await resolve.eventstoreAdapter.getEventSubscribers()
    for (const {
      applicationName,
      eventSubscriber,
      destination,
    } of eventSubscribers) {
      if (
        resolve.applicationName !== applicationName ||
        !resolve.eventListeners.has(eventSubscriber)
      ) {
        promises.push(
          Promise.resolve()
            .then(notifyEventSubscriber.bind(null, resolve, destination))
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.warn(
                `Notify application "${applicationName}" for event subscriber "${eventSubscriber}" failed with error: ${error}`
              )
            })
        )
      }
    }

    await Promise.all(promises)

    if (timerId != null) {
      clearTimeout(timerId)
    }
  })()

  await Promise.race([timerPromise, inlineLedgerPromise])
}

const onCommandExecuted = async (resolve, event) => {
  await notifyEventSubscribers(resolve)
  await resolve.sendReactiveEvent(event)
}

const createOnCommandExecuted = (resolve) => {
  return onCommandExecuted.bind(null, resolve)
}

export default createOnCommandExecuted
