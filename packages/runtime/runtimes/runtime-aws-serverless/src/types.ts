import {
  EventSubscriberNotification,
  EventSubscriberNotifier,
} from '@resolve-js/runtime-base'

export type EventSubscriberInterface = {
  notifyEventSubscriber: EventSubscriberNotifier
  invokeBuildAsync: (params: EventSubscriberNotification) => Promise<void>
  getEventSubscriberDestination: (name: string) => string
  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>
}
