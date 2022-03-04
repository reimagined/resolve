import type { Eventstore } from './types'
import eventSubscriberProperties from './event-subscribers-properties'

const sideEffectTimestampProviderFactory = (
  eventstoreAdapter: Eventstore,
  applicationName: string
) => {
  const sideEffectTimestampProvider = {
    getSideEffectsTimestamp: async (eventSubscriber: string) =>
      +(await eventSubscriberProperties.getProperty(
        eventstoreAdapter,
        applicationName,
        {
          eventSubscriber,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
        }
      )),
    setSideEffectsTimestamp: async (
      eventSubscriber: string,
      sideEffectTimestamp: number
    ) =>
      await eventSubscriberProperties.setProperty(
        eventstoreAdapter,
        applicationName,
        {
          eventSubscriber,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
          value: sideEffectTimestamp,
        }
      ),
  }

  return sideEffectTimestampProvider
}

export default sideEffectTimestampProviderFactory
