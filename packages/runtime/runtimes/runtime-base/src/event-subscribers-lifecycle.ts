import { Eventstore } from './types'

const eventSubscribersLifecycle = {
  subscribe: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    getEventSubscriberDestination: Function,
    eventSubscriber: string,
    parameters: {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => {
    const entry = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0]
    if (entry == null) {
      await eventstoreAdapter.ensureEventSubscriber({
        applicationName,
        eventSubscriber,
        destination: getEventSubscriberDestination(eventSubscriber),
        status: {
          eventSubscriber,
          status: 'deliver',
          busy: false,
          ...parameters.subscriptionOptions,
        },
      })
    } else {
      await eventstoreAdapter.ensureEventSubscriber({
        applicationName,
        eventSubscriber,
        status: {
          eventSubscriber,
          status: 'deliver',
          busy: false,
          ...entry.status,
          ...parameters.subscriptionOptions,
        },
        updateOnly: true,
      })
    }
  },

  resubscribe: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    getEventSubscriberDestination: Function,
    eventSubscriber: string,
    parameters: {
      subscriptionOptions: {
        eventTypes: Array<string> | null
        aggregateIds: Array<string> | null
      }
    }
  ) => {
    await eventstoreAdapter.ensureEventSubscriber({
      applicationName,
      eventSubscriber,
      destination: getEventSubscriberDestination(eventSubscriber),
      status: {
        eventSubscriber,
        status: 'deliver',
        busy: false,
        ...parameters.subscriptionOptions,
      },
    })
  },

  unsubscribe: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    getEventSubscriberDestination: Function,
    eventSubscriber: string,
    parameters: {}
  ) => {
    const entry = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0]

    if (entry != null) {
      await eventstoreAdapter.removeEventSubscriber({
        applicationName,
        eventSubscriber,
      })
    }
  },
} as const

export default eventSubscribersLifecycle
