import type { Event, Command } from '@resolve-js/core'

import type { Resolve } from './types'

const onCommandExecuted = async (
  resolve: Resolve,
  event: Event,
  command: Command,
  eventWithCursor?: { event: Event; cursor: string }
) => {
  await resolve.notifyEventSubscribers(eventWithCursor)
  await resolve.sendReactiveEvent(event)
  void command
}

const createOnCommandExecuted = (resolve: Resolve) => {
  return onCommandExecuted.bind(null, resolve)
}

export default createOnCommandExecuted
