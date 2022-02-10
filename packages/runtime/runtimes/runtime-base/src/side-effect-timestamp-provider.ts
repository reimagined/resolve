import type { EventSubscriber } from './types'

const sifeEffectTimestampProviderFactory = ({ eventSubscriber}:  { eventSubscriber: EventSubscriber }) => {
    const sifeEffectTimestampProvider = {
    currentEventSubscriber: '',
    getSideEffectsTimestamp: () => eventSubscriber.getProperty({
      eventSubscriber: sifeEffectTimestampProvider.currentEventSubscriber,
      key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
    }),
    setSideEffectsTimestamp: (sideEffectTimestamp: number) => eventSubscriber.setProperty({
      eventSubscriber: sifeEffectTimestampProvider.currentEventSubscriber,
      key: 'RESOLVE_SIDE_EFFECTS_START_TIMESTAMP',
      value: sideEffectTimestamp,
    }),
    setCurrentEventSubscriber: (eventSubscriber: string) => {
      sifeEffectTimestampProvider.currentEventSubscriber = eventSubscriber
    }
  } 

  return sifeEffectTimestampProvider
}

export default sifeEffectTimestampProviderFactory

