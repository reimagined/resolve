import partial from 'lodash.partial'
import { getLog } from '../common/utils/get-log'
import type { EventSubscriberNotifier } from '../common'
import { createEventSubscriberNotification } from '../common'

type NotifierRuntime = {
  //TODO: types
  sendSqsMessage: Function
  invokeLambdaAsync: Function
}

// TODO: destination can be determined here too (see resolve.getEventSubscriberDestination)
const notifyEventSubscriber: (
  runtime: NotifierRuntime,
  ...args: Parameters<EventSubscriberNotifier>
) => Promise<void> = async (
  runtime: NotifierRuntime,
  destination,
  eventSubscriber,
  event?
) => {
  const log = getLog(`notifyEventSubscriber:${eventSubscriber}`)
  if (/^arn:aws:sqs:/.test(destination)) {
    const queueFullName = destination.split(':')[5]
    await runtime.sendSqsMessage(
      queueFullName,
      createEventSubscriberNotification(eventSubscriber, event, true)
    )
  } else if (/^arn:aws:lambda:/.test(destination)) {
    const lambdaFullName = destination.split(':')[6]
    await runtime.invokeLambdaAsync(lambdaFullName, {
      resolveSource: 'BuildEventSubscriber',
      ...createEventSubscriberNotification(eventSubscriber, event, true),
    })
  } else {
    log.warn(
      `event subscriber destination not supported by runtime: ${destination}`
    )
  }
}

export const eventSubscriberNotifierFactory = (
  runtime: NotifierRuntime
): EventSubscriberNotifier => partial(notifyEventSubscriber, runtime)
