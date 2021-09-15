import { Monitoring, PerformanceTracer } from '@resolve-js/core'
import { Adapter } from '@resolve-js/eventstore-base'
import {
  EventSubscriberNotifier,
  ReadModelConnectorFactory,
  Resolve,
} from './types'
import { getLog } from './utils/get-log'
import { subscribersNotifierFactory } from './subscribers-notifier-factory'
import createOnCommandExecuted from './on-command-executed'

export type EventStoreAdapterFactory = () => Adapter

export type RuntimeFactoryParameters = {
  performanceTracer: PerformanceTracer
  monitoring: Monitoring
  eventStoreAdapterFactory: EventStoreAdapterFactory
  readModelConnectorsFactories: Record<string, ReadModelConnectorFactory>
  getVacantTimeInMillis: () => number
  eventSubscriberScope: string
  notifyEventSubscriber: EventSubscriberNotifier
  invokeBuildAsync: Resolve['invokeBuildAsync']
  eventListeners: Resolve['eventListeners']
}

const buildReadModelConnectors = (
  factories: Record<string, ReadModelConnectorFactory>,
  performanceTracer: PerformanceTracer,
  monitoring: Monitoring
): Resolve['readModelConnectors'] =>
  Object.keys(factories).reduce<Resolve['readModelConnectors']>(
    (connectors, name) => {
      connectors[name] = factories[name]({
        performanceTracer,
        monitoring,
      })
      return connectors
    },
    {}
  )

export const createRuntime = async (
  params: RuntimeFactoryParameters
): Resolve => {
  const log = getLog(`createResolve`)

  const {
    performanceTracer,
    monitoring,
    eventStoreAdapterFactory,
    readModelConnectorsFactories,
  } = params

  log.debug(`building event store adapter`)
  const eventStoreAdapter = await eventStoreAdapterFactory()

  log.debug(`building read models connectors`)
  const readModelConnectors = buildReadModelConnectors(
    readModelConnectorsFactories,
    performanceTracer,
    monitoring
  )
  log.debug(`${Object.keys(readModelConnectors).length} connectors built`)

  const {
    getVacantTimeInMillis,
    eventSubscriberScope,
    eventListeners,
    invokeBuildAsync,
    notifyEventSubscriber,
  } = params

  const notifyEventSubscribers = subscribersNotifierFactory({
    eventStoreAdapter,
    getVacantTimeInMillis,
    eventSubscriberScope,
    notifyEventSubscriber,
    invokeBuildAsync,
    eventListeners,
  })
  const onCommandExecuted = createOnCommandExecuted(resolve)
}
