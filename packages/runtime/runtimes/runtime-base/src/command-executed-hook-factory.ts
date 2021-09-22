import partial from 'lodash.partial'
import type {
  Command,
  EventPointer,
  StoredEventPointer,
} from '@resolve-js/core'
import type { ReactiveEventDispatcher } from './types'

type CommandExecutedHookRuntime = {
  broadcastEvent: (event: EventPointer) => Promise<void>
  sendReactiveEvent: ReactiveEventDispatcher
}

const commandExecutedHook = async (
  runtime: CommandExecutedHookRuntime,
  command: Command,
  storedEventPointer: StoredEventPointer
) => {
  await runtime.broadcastEvent(storedEventPointer)
  await runtime.sendReactiveEvent(storedEventPointer.event)
}

export const commandExecutedHookFactory = (
  runtime: CommandExecutedHookRuntime
) => partial(commandExecutedHook, runtime)
