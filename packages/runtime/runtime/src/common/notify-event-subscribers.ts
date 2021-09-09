import type { Event } from '@resolve-js/core'
import type { Resolve, BuildParameters } from './types'

type EventWithCursor = {
  event: Event
  cursor: string
}

const getNotificationObject = (
  eventSubscriber: string,
  eventWithCursor?: EventWithCursor,
  isForeign?: boolean
): BuildParameters => ({
  eventSubscriber,
  initiator: isForeign ? 'command-foreign' : 'command',
  notificationId: `NT-${Date.now()}${Math.floor(Math.random() * 1000000)}`,
  sendTime: Date.now(),
  ...(eventWithCursor != null ? eventWithCursor : {}),
})

const notifyEventSubscriber = async (
  resolveBase: Resolve,
  destination: string,
  eventSubscriber: string,
  eventWithCursor?: EventWithCursor
) => {
  switch (true) {
    case /^https?:\/\//.test(destination): {
      await new Promise((resolve, reject) => {
        const req = (destination.startsWith('https')
          ? resolveBase.https
          : resolveBase.http
        ).request(`${destination}/${eventSubscriber}`, (res) => {
          res.on('data', () => {
            return
          })
          res.on('end', resolve)
          res.on('error', reject)
        })
        req.on('error', reject)
        req.end()
      })
      break
    }
    case /^arn:aws:sqs:/.test(destination): {
      const queueFullName = destination.split(':')[5]
      await resolveBase.sendSqsMessage(
        queueFullName,
        getNotificationObject(eventSubscriber, eventWithCursor, true)
      )
      break
    }
    case /^arn:aws:lambda:/.test(destination): {
      const lambdaFullName = destination.split(':')[6]
      await resolveBase.invokeLambdaAsync(lambdaFullName, {
        resolveSource: 'BuildEventSubscriber',
        ...getNotificationObject(eventSubscriber, eventWithCursor, true),
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

const notifyEventSubscribers = async (
  resolve: Resolve,
  eventWithCursor?: EventWithCursor
) => {
  const maxDuration = Math.max(resolve.getVacantTimeInMillis() - 15000, 0)
  let timerId = null

  const timerPromise = new Promise((resolve) => {
    timerId = setTimeout(resolve, maxDuration)
  })

  const inlineLedgerPromise = (async () => {
    const promises = []
    for (const { name: eventSubscriber } of resolve.eventListeners.values()) {
      promises.push(
        resolve.invokeBuildAsync(
          getNotificationObject(eventSubscriber, eventWithCursor)
        )
      )
    }

    const eventSubscribers = await resolve.eventstoreAdapter.getEventSubscribers()
    for (const {
      applicationName: eventSubscriberScope,
      eventSubscriber,
      destination,
    } of eventSubscribers) {
      if (
        resolve.eventSubscriberScope !== eventSubscriberScope ||
        !resolve.eventListeners.has(eventSubscriber)
      ) {
        promises.push(
          Promise.resolve()
            .then(
              notifyEventSubscriber.bind(
                null,
                resolve,
                destination,
                eventSubscriber,
                eventWithCursor
              )
            )
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.warn(
                `Notify application "${eventSubscriberScope}" for event subscriber "${eventSubscriber}" failed with error: ${error}`
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

const createNotifyEventSubscribers = (resolve: Resolve) =>
  notifyEventSubscribers.bind(null, resolve)

export default createNotifyEventSubscribers
