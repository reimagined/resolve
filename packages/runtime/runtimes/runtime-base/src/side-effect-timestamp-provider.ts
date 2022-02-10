import type { EventSubscriber } from './types'

const sideEffectTimestampProviderFactory = ({
  eventSubscriber,
}: {
  eventSubscriber: EventSubscriber
}) => {
  const sideEffectTimestampProvider = {
    currentEventSubscriber: '',
    getSideEffectsTimestamp: () =>
      eventSubscriber.getProperty({
        eventSubscriber: sideEffectTimestampProvider.currentEventSubscriber,
        key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
      }),
    setSideEffectsTimestamp: (sideEffectTimestamp: number) =>
      eventSubscriber.setProperty({
        eventSubscriber: sideEffectTimestampProvider.currentEventSubscriber,
        key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
        value: sideEffectTimestamp,
      }),
    setCurrentEventSubscriber: (eventSubscriber: string) => {
      sideEffectTimestampProvider.currentEventSubscriber = eventSubscriber
    },
  }

  return sideEffectTimestampProvider
}

export default sideEffectTimestampProviderFactory
