import { EventWithCursor } from '@resolve-js/core'
import { EventSubscriberNotification } from '../types'

export const createEventSubscriberNotification = (
  eventSubscriber: string,
  eventWithCursor?: EventWithCursor,
  isForeign?: boolean
): EventSubscriberNotification => ({
  eventSubscriber,
  initiator: isForeign ? 'command-foreign' : 'command',
  notificationId: `NT-${Date.now()}${Math.floor(Math.random() * 1000000)}`,
  sendTime: Date.now(),
  ...(eventWithCursor != null ? eventWithCursor : {}),
})
