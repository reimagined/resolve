import type { Eventstore } from './types'
import eventSubscriberProperties from './event-subscribers-properties'

const sideEffectTimestampProviderFactory = (
  eventstoreAdapter: Eventstore,
  applicationName: string
) => {
  const sideEffectTimestampProvider = {
    currentEventSubscriber: '',
    getSideEffectsTimestamp: () =>
      eventSubscriberProperties.getProperty(
        eventstoreAdapter,
        applicationName,
        {
          eventSubscriber: sideEffectTimestampProvider.currentEventSubscriber,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
        }
      ),
    setSideEffectsTimestamp: (sideEffectTimestamp: number) =>
      eventSubscriberProperties.setProperty(
        eventstoreAdapter,
        applicationName,
        {
          eventSubscriber: sideEffectTimestampProvider.currentEventSubscriber,
          key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
          value: sideEffectTimestamp,
        }
      ),
    setCurrentEventSubscriber: (eventSubscriber: string) => {
      sideEffectTimestampProvider.currentEventSubscriber = eventSubscriber
    },
  }

  return sideEffectTimestampProvider
}

export default sideEffectTimestampProviderFactory
