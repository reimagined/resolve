import http from 'http'

const notifyEventSubscriber = async (resolve, destination, eventSubscriber) => {
  switch (true) {
    case /^https?:\/\//.test(destination): {
      await new Promise((resolve, reject) => {
        const req = http.request(`${destination}/${eventSubscriber}`, (res) => {
          res.on('data', () => {})
          res.on('end', resolve)
          res.on('error', reject)
        })
        req.on('error', reject)
        req.end()
      })
      break
    }
    case /^arn:aws:lambda:/.test(destination): {
      await resolve.lambda.invokeFunction({
        FunctionName: destination,
        InvocationType: 'Event',
        Region: destination.split(':')[3],
        Payload: {
          resolveSource: 'EventSubscriberDirect',
          method: 'build',
          payload: { eventSubscriber },
        },
      })
      break
    }
    default: {
      // eslint-disable-next-line no-console
      console.warn(`Unknown event subscriber destination`)
      break
    }
  }
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
            .then(
              notifyEventSubscriber.bind(
                null,
                resolve,
                destination,
                eventSubscriber
              )
            )
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
