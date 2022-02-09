import type {
  ObjectFixedIntersectionToObject,
  UnknownReadModelConnector,
  RegularReadModelConnectorOperations,
  RegularReadModelConnector,
  RegularReadModelConnection,
  CustomReadModelConnection,
  CustomReadModelConnector,
  OmitRegularReadModelArgs,
  EventSubscriberRuntime,
  ReadModelInteropMap,
  UnionMethodToUnionArgsMethod,
  ExtractTupleUnion,
  SagaInteropMap,
  EventSubscriber,
  EventListener,
  CallMethodParams,
  Eventstore,
  FunctionLike,
  UnPromise,
} from './types'

import eventSubscribersLifecycle from './event-subscribers-lifecycle'
import eventSubscribersProperties from './event-subscribers-properties'
import parseEventSubscriberParameters from './parse-event-subscriber-parameters'

export const checkAllMethodsExist = <T extends object, K extends readonly string[]>(
  obj: T,
  keys: K extends Array<keyof T> ? K : readonly string[]
) =>
  keys.reduce<boolean>(
    (acc, key) => acc && typeof (obj as any)[key] === 'function',
    true
  ) as (K extends Array<keyof T> ? true : false)


export const isRegularConnector = (connector: UnknownReadModelConnector): connector is RegularReadModelConnector => 
  checkAllMethodsExist(
    connector as ObjectFixedIntersectionToObject<UnknownReadModelConnector>,
    ['connect', 'disconnect', 'dispose',   'build',
    'reset',
    'resume',
    'pause',
    'subscribe',
    'resubscribe',
    'unsubscribe',
    'status']
  )

export const isCustomConnector = (connector: UnknownReadModelConnector): connector is CustomReadModelConnector => 
  checkAllMethodsExist(
    connector as ObjectFixedIntersectionToObject<UnknownReadModelConnector>,
    ['connect', 'disconnect', 'dispose', 'drop']
  )


const getConnector = (runtime: EventSubscriberRuntime, eventSubscriber: string): [string, UnknownReadModelConnector] => {
  const listenerInfo = runtime.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  let connectorName: string
  if(listenerInfo.isSaga) {
    connectorName = runtime.sagasInterop[eventSubscriber].connectorName
  } else {
    connectorName = runtime.readModelsInterop[eventSubscriber].connectorName
  }
  const connector = runtime.readModelConnectors[connectorName]
  return [connectorName, connector]
}

const throwNoConnectorError = (connectorName: string) => {
  throw new Error(`Invalid adapter ${connectorName}`)
}

const executeRegularConnectorMethod = async <K extends keyof RegularReadModelConnectorOperations>(
  connector: RegularReadModelConnector,
  methodName: K,
  eventSubscriber: string,
  ...args: OmitRegularReadModelArgs<Parameters<RegularReadModelConnectorOperations[K]>>
) : Promise<UnPromise<ReturnType<RegularReadModelConnectorOperations[K] > >> => {
    let store: RegularReadModelConnection | undefined = undefined
    try {
       store = await connector.connect(eventSubscriber)
       const method = connector[methodName] as UnionMethodToUnionArgsMethod<RegularReadModelConnectorOperations[keyof RegularReadModelConnectorOperations] >
       const result = await method(store, eventSubscriber,
        ...(args  as ExtractTupleUnion<OmitRegularReadModelArgs<Parameters<RegularReadModelConnectorOperations[keyof RegularReadModelConnectorOperations]>>>  )
        )
       return result as UnPromise<ReturnType<RegularReadModelConnector[K] > >
    } finally {
      if(store != null) {
        await connector.disconnect(store)
      }
    }
}


const subscribeImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
  eventSubscriber?: string | null | undefined,
  modelName?: string | null | undefined,
  subscriptionOptions: {
    eventTypes: Array<string> | null
    aggregateIds: Array<string> | null
  }
}) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connectorName, connector] = getConnector(runtime, eventSubscriber)
  if(isRegularConnector(connector) || isCustomConnector(connector)) {
    try {
      if(isRegularConnector(connector)) {
        await executeRegularConnectorMethod(
          connector,
          'subscribe',
          eventSubscriber,
          parameters.subscriptionOptions.eventTypes,
          parameters.subscriptionOptions.aggregateIds,
          runtime.loadReadModelProcedure.bind(runtime, eventSubscriber)
        )
      }
    } finally {
      await eventSubscribersLifecycle.subscribe(
        runtime.eventstoreAdapter,
        runtime.applicationName,
        runtime.getEventSubscriberDestination,
        eventSubscriber,
        parameters
      )
    }
  } else {
    throwNoConnectorError(connectorName)
  }
}

const resubscribeImpl = async () => {}

const unsubscribeImpl = async () => {}

const buildImpl = async () => {}

const resumeImpl = async () => {}

const pauseImpl = async () => {}

const resetImpl = async () => {}

const statusImpl = async () => {}


const next = async (
  eventSubscriber: string,
  timeout?: number,
  notificationExtraPayload?: object,
  ...args: any[]
) => {
  if (args.length > 0) {
    throw new TypeError('Next should be invoked with no arguments')
  }
  if (timeout != null && (isNaN(+timeout) || +timeout < 0)) {
    throw new TypeError('Timeout should be non-negative integer')
  }
  if (
    notificationExtraPayload != null &&
    notificationExtraPayload.constructor !== Object
  ) {
    throw new TypeError('Notification extra payload should be plain object')
  }

  await pool.invokeBuildAsync(
    {
      eventSubscriber,
      initiator: 'read-model-next',
      notificationId: `NT-${Date.now()}${Math.floor(Math.random() * 1000000)}`,
      sendTime: Date.now(),
      ...notificationExtraPayload,
    },
    timeout != null ? Math.floor(+timeout) : timeout
  )
}

const eventSubscriberFactory = (runtime: EventSubscriberRuntime) => {
  const eventSubscriber = Object.freeze({
    deleteProperty: eventSubscribersProperties.deleteProperty.bind(null, runtime.eventstoreAdapter, runtime.applicationName),
    listProperties: eventSubscribersProperties.listProperties.bind(null, runtime.eventstoreAdapter, runtime.applicationName),
    getProperty: eventSubscribersProperties.getProperty.bind(null, runtime.eventstoreAdapter, runtime.applicationName),
    setProperty: eventSubscribersProperties.setProperty.bind(null, runtime.eventstoreAdapter, runtime.applicationName),
    subscribe: subscribeImpl.bind(null, runtime),
    resubscribe: resubscribeImpl.bind(null, runtime),
    unsubscribe: unsubscribeImpl.bind(null, runtime),
    build: buildImpl.bind(null, runtime),
    resume: resumeImpl.bind(null, runtime),
    pause: pauseImpl.bind(null, runtime),
    reset: resetImpl.bind(null, runtime),
    status: statusImpl.bind(null, runtime),
  })

  return eventSubscriber
}

export default eventSubscriberFactory

