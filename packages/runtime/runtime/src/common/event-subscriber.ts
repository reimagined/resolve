import type {
  EventSubscriber,
  EventListener,
  CallMethodParams,
  SagaExecutor,
  QueryExecutor,
} from './types'

type EventSubscriberRuntime = {
  executeSaga: SagaExecutor
  executeQuery: QueryExecutor
  eventListeners: Map<string, EventListener>
}

const eventSubscriberMethod = async (
  runtime: EventSubscriberRuntime,
  key: string,
  params: CallMethodParams,
  ...args: any[]
): Promise<any> => {
  if (args.length !== 0 || params === undefined || Object(params) !== params) {
    throw new TypeError(
      `Invalid EventSubscriber method "${key}" arguments ${JSON.stringify([
        params,
        ...args,
      ])}`
    )
  }

  const { eventSubscriber, modelName, ...parameters } = params
  let eventSubscriberName: string

  if (eventSubscriber == null) {
    if (modelName == null) {
      throw new Error(`Both "eventSubscriber" and "modelName" are null`)
    }
    eventSubscriberName = modelName
  } else {
    eventSubscriberName = eventSubscriber
  }

  const listenerInfo = runtime.eventListeners.get(eventSubscriberName)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }

  const method = listenerInfo.isSaga
    ? runtime.executeSaga[key]
    : runtime.executeQuery[key]

  if (typeof method != 'function') {
    throw new TypeError(key)
  }

  return await method({ modelName: eventSubscriberName, ...parameters })
}

export const eventSubscriberFactory = (runtime: EventSubscriberRuntime) => {
  const eventSubscriber = new Proxy<EventSubscriber>(
    {},
    {
      get(_, key: string) {
        return eventSubscriberMethod.bind(null, runtime, key)
      },
      set() {
        throw new Error(`Event subscriber API is immutable`)
      },
    }
  )

  return eventSubscriber
}
