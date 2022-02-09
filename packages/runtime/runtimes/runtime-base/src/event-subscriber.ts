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
  UnionMethodToUnionArgsMethod,
  ExtractTupleUnion,
  ReadModelInterop,
  SagaInterop,
  UnPromise,
} from './types'

import parseEventSubscriberParameters from './parse-event-subscriber-parameters'
import eventSubscribersLifecycle from './event-subscribers-lifecycle'
import eventSubscribersProperties from './event-subscribers-properties'
import customReadModelMethods from './custom-read-model'

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
    connector as ObjectFixedIntersectionToObject<UnknownReadModelConnector>, [
    'connect',
    'disconnect',
    'dispose',
    'build',
    'reset',
    'resume',
    'pause',
    'subscribe',
    'resubscribe',
    'unsubscribe',
    'status'
  ])

export const isCustomConnector = (connector: UnknownReadModelConnector): connector is CustomReadModelConnector => 
  checkAllMethodsExist(
    connector as ObjectFixedIntersectionToObject<UnknownReadModelConnector>, [
    'connect',
    'disconnect',
    'dispose',
    'drop'
  ])


const getConnectorAndInterop = (runtime: EventSubscriberRuntime, eventSubscriber: string): [UnknownReadModelConnector, ReadModelInterop | SagaInterop] => {
  const listenerInfo = runtime.eventListeners.get(eventSubscriber)
  if (listenerInfo == null) {
    throw new Error(`Listener ${eventSubscriber} does not exist`)
  }
  let interop: ReadModelInterop | SagaInterop
  if(listenerInfo.isSaga) {
    interop = runtime.sagasInterop[eventSubscriber]
  } else {
    interop = runtime.readModelsInterop[eventSubscriber]
  }
  const connector = runtime.readModelConnectors[interop.connectorName]
  return [connector, interop]
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
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
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
    throwNoConnectorError(interop.connectorName)
  }
}

const resubscribeImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
    subscriptionOptions: {
      eventTypes: Array<string> | null
      aggregateIds: Array<string> | null
    }
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector) || isCustomConnector(connector)) {
    try {
      if(isRegularConnector(connector)) {
        await executeRegularConnectorMethod(
          connector,
          'resubscribe',
          eventSubscriber,
          parameters.subscriptionOptions.eventTypes,
          parameters.subscriptionOptions.aggregateIds,
          runtime.loadReadModelProcedure.bind(runtime, eventSubscriber)
        )
      } else {
        const store = await connector.connect(eventSubscriber)
        await connector.drop(store, eventSubscriber)
        await connector.disconnect(store, eventSubscriber)
      }
    } finally {
      await eventSubscribersLifecycle.resubscribe(
        runtime.eventstoreAdapter,
        runtime.applicationName,
        runtime.getEventSubscriberDestination,
        eventSubscriber,
        parameters
      )
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}

const unsubscribeImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector) || isCustomConnector(connector)) {
    try {
      if(isRegularConnector(connector)) {
        await executeRegularConnectorMethod(
          connector,
          'unsubscribe',
          eventSubscriber,
          runtime.loadReadModelProcedure.bind(runtime, eventSubscriber)
        )
      } else {
        const store = await connector.connect(eventSubscriber)
        await connector.drop(store, eventSubscriber)
        await connector.disconnect(store, eventSubscriber)
      }
    } finally {
      await eventSubscribersLifecycle.unsubscribe(
        runtime.eventstoreAdapter,
        runtime.applicationName,
        runtime.getEventSubscriberDestination,
        eventSubscriber,
        parameters
      )
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}

const buildImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
    initiator: any
    notificationId: any
    sendTime: any
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector)) {
    let store: RegularReadModelConnection | undefined = undefined
    try {
      store = await connector.connect(eventSubscriber)
      return await connector.build(store, eventSubscriber, store, interop, runtime.eventstoreAdapter as any, runtime.getVacantTimeInMillis, parameters)
    } finally {
      if(store != null) {
        await connector.disconnect(store)
      }
    }
  } else if(isCustomConnector(connector)) {
    let store: CustomReadModelConnection | undefined = undefined
    try {
      store = await connector.connect(eventSubscriber)
      return await customReadModelMethods.build(runtime.eventstoreAdapter, runtime.applicationName, interop, store, eventSubscriber, runtime.getVacantTimeInMillis, parameters)
    } finally {
      if(store != null) {
        await connector.disconnect(store, eventSubscriber)
      }
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}

const resumeImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector)) {
    return await executeRegularConnectorMethod(connector, 'resume', eventSubscriber)
  } else if(isCustomConnector(connector)) {
    let store: CustomReadModelConnection | undefined = undefined
    try {
      store = await connector.connect(eventSubscriber)
      return await customReadModelMethods.resume(runtime.eventstoreAdapter, runtime.applicationName, interop, store, eventSubscriber, parameters)
    } finally {
      if(store != null) {
        await connector.disconnect(store, eventSubscriber)
      }
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}

const pauseImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector)) {
    return await executeRegularConnectorMethod(connector, 'pause', eventSubscriber)
  } else if(isCustomConnector(connector)) {
    let store: CustomReadModelConnection | undefined = undefined
    try {
      store = await connector.connect(eventSubscriber)
      return await customReadModelMethods.pause(runtime.eventstoreAdapter, runtime.applicationName, interop, store, eventSubscriber, parameters)
    } finally {
      if(store != null) {
        await connector.disconnect(store, eventSubscriber)
      }
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}

const resetImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector)) {
    return await executeRegularConnectorMethod(connector, 'reset', eventSubscriber)
  } else if(isCustomConnector(connector)) {
    let store: CustomReadModelConnection | undefined = undefined
    try {
      store = await connector.connect(eventSubscriber)
      return await customReadModelMethods.reset(runtime.eventstoreAdapter, runtime.applicationName, interop, store, eventSubscriber, 
         connector.drop.bind(connector, store, eventSubscriber),  
      parameters)
    } finally {
      if(store != null) {
        await connector.disconnect(store, eventSubscriber)
      }
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}

const statusImpl = async (
  runtime: EventSubscriberRuntime,
  params: {  
    eventSubscriber?: string | null | undefined,
    modelName?: string | null | undefined,
    includeRuntimeStatus?: boolean | undefined,
    retryTimeoutForRuntimeStatus?: number | undefined
  }
) => {
  const [eventSubscriber, parameters] = parseEventSubscriberParameters(params)
  const [connector, interop] = getConnectorAndInterop(runtime, eventSubscriber)
  if(isRegularConnector(connector)) {
    return await executeRegularConnectorMethod(connector, 'status', eventSubscriber, runtime.eventstoreAdapter as any, parameters.includeRuntimeStatus, parameters.retryTimeoutForRuntimeStatus)
  } else if(isCustomConnector(connector)) {
    let store: CustomReadModelConnection | undefined = undefined
    try {
      store = await connector.connect(eventSubscriber)
      return await customReadModelMethods.status(runtime.eventstoreAdapter, runtime.applicationName, interop, store, eventSubscriber, parameters)
    } finally {
      if(store != null) {
        await connector.disconnect(store, eventSubscriber)
      }
    }
  } else {
    throwNoConnectorError(interop.connectorName)
  }
}


// const next = async (
//   eventSubscriber: string,
//   timeout?: number,
//   notificationExtraPayload?: object,
//   ...args: any[]
// ) => {
//   if (args.length > 0) {
//     throw new TypeError('Next should be invoked with no arguments')
//   }
//   if (timeout != null && (isNaN(+timeout) || +timeout < 0)) {
//     throw new TypeError('Timeout should be non-negative integer')
//   }
//   if (
//     notificationExtraPayload != null &&
//     notificationExtraPayload.constructor !== Object
//   ) {
//     throw new TypeError('Notification extra payload should be plain object')
//   }

//   await pool.invokeBuildAsync(
//     {
//       eventSubscriber,
//       initiator: 'read-model-next',
//       notificationId: `NT-${Date.now()}${Math.floor(Math.random() * 1000000)}`,
//       sendTime: Date.now(),
//       ...notificationExtraPayload,
//     },
//     timeout != null ? Math.floor(+timeout) : timeout
//   )
// }

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

