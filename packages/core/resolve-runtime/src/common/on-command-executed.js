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
