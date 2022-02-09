import { Eventstore } from './types'
import parseEventSubscriberParameters from './parse-event-subscriber-parameters'

const eventSubscribersProperties = {
  deleteProperty: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    params: {
      eventSubscriber?: string | null | undefined,
      modelName?: string | null | undefined,
      key: string
    }
    ) => {
    const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
    const entry = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0]
    if (entry == null) {
      return
    }
    const status = entry.status ?? {}
    const { [parameters.key]: _, ...currentProperties } =
      status.properties ?? {}
    await eventstoreAdapter.ensureEventSubscriber({
      applicationName,
      eventSubscriber,
      status: {
        ...status,
        properties: currentProperties,
      },
      updateOnly: true,
    })
  },

  getProperty: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    params: {
      eventSubscriber?: string | null | undefined,
      modelName?: string | null | undefined,
      key: string
    }
    ) => {
    const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
    const { status } = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0] ?? { status: null }

    return (status?.properties ?? {})[parameters.key]
  },

  listProperties: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    params: {
      eventSubscriber?: string | null | undefined,
      modelName?: string | null | undefined,
      key: string
    }
      ) => {
    const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
    const { status } = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0] ?? { status: null }

    return status?.properties ?? {}
  },

  setProperty: async (
    eventstoreAdapter: Eventstore,
    applicationName: string,
    params: {
      eventSubscriber?: string | null | undefined,
      modelName?: string | null | undefined,
      key: string,
      value: any,
    }
    ) => {
    const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
    const entry = (
      await eventstoreAdapter.getEventSubscribers({
        applicationName,
        eventSubscriber,
      })
    )[0]
    if (entry == null) {
      return
    }
    const status = entry.status ?? {}
    const { ...currentProperties } = status.properties ?? {}
    await eventstoreAdapter.ensureEventSubscriber({
      applicationName,
      eventSubscriber,
      status: {
        ...status,
        properties: {
          ...currentProperties,
          [parameters.key]: `${parameters.value}`,
        },
      },
      updateOnly: true,
    })
  }
} as const

export default eventSubscribersProperties
