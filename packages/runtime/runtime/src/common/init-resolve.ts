import createCommandExecutor from '../common/command/index'
import createQueryExecutor from '../common/query/index'
import createSagaExecutor from '../common/saga/index'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

import liveEntryDir from './dynamic-require/live-entry-dir'
import createNotifyEventSubscribers from './notify-event-subscribers'
import createOnCommandExecuted from './on-command-executed'
import createEventSubscriber from './event-subscriber'

import type {
  Event,
  Command,
  AggregateInterop,
  Eventstore as CoreEventstoreAdapter,
} from '@resolve-js/core'

import type { Resolve } from './types'

const DEFAULT_WORKER_LIFETIME = 4 * 60 * 1000

const initResolve = async (resolve: Resolve) => {
  const performanceTracer = resolve.performanceTracer

  const {
    eventstoreAdapter: createEventstoreAdapter,
    readModelConnectors: readModelConnectorsCreators,
  } = resolve.assemblies

  const {
    invokeBuildAsync,
    eventSubscriberScope,
    uploader,
    scheduler,
    monitoring,
    domainInterop,
    domain,
  } = resolve

  const eventstoreAdapter = createEventstoreAdapter()

  const readModelConnectors: any = {}
  for (const name of Object.keys(readModelConnectorsCreators)) {
    readModelConnectors[name] = readModelConnectorsCreators[name]({
      performanceTracer,
      monitoring,
    })
  }

  if (resolve.getVacantTimeInMillis == null) {
    const endTime = Date.now() + DEFAULT_WORKER_LIFETIME
    resolve.getVacantTimeInMillis = () => endTime - Date.now()
  }

  const readModelSources = new Proxy(
    {},
    {
      get(target: any, key) {
        if (!target.hasOwnProperty(key)) {
          target[key] = null
          const entryDir = liveEntryDir()
          if (
            domain.readModels.find(({ name }) => name === key) &&
            entryDir != null
          ) {
            try {
              target[key] = fs
                .readFileSync(
                  path.join(String(entryDir), `read-model-${String(key)}.js`)
                )
                .toString('utf8')
            } catch (err) {}
          }
        }
        return target[key]
      },
      set() {
        throw new Error(`Read model sources are immutable`)
      },
    }
  )

  resolve.readModelConnectors = readModelConnectors
  resolve.eventstoreAdapter = eventstoreAdapter
  resolve.readModelSources = readModelSources

  const getVacantTimeInMillis = resolve.getVacantTimeInMillis
  const notifyEventSubscribers = createNotifyEventSubscribers(resolve)
  const onCommandExecuted = createOnCommandExecuted(resolve)

  const secretsManager = await eventstoreAdapter.getSecretsManager()

  const {
    command: commandMiddlewares = [],
    resolver: resolverMiddlewares = [],
    projection: projectionMiddlewares = [],
  } = domain.middlewares ?? {}
  const aggregateRuntime = {
    monitoring,
    secretsManager,
    eventstore: eventstoreAdapter,
    hooks: {
      postSaveEvent: async (
        aggregate: AggregateInterop,
        command: Command,
        event: Event,
        eventWithCursor?: { event: Event; cursor: string }
      ) => {
        await onCommandExecuted(event, command, eventWithCursor)
        //return false
      },
    },
    commandMiddlewares,
  }

  const executeCommand = createCommandExecutor({
    performanceTracer,
    aggregatesInterop: domainInterop.aggregateDomain.acquireAggregatesInterop(
      aggregateRuntime
    ),
  })

  const executeSchedulerCommand = createCommandExecutor({
    performanceTracer,
    aggregatesInterop: domainInterop.sagaDomain.acquireSchedulerAggregatesInterop(
      aggregateRuntime
    ),
  })

  const executeQuery = createQueryExecutor({
    invokeBuildAsync,
    applicationName: eventSubscriberScope,
    eventstoreAdapter: eventstoreAdapter,
    readModelConnectors,
    readModelSources,
    performanceTracer,
    getVacantTimeInMillis,
    monitoring,
    readModelsInterop: domainInterop.readModelDomain.acquireReadModelsInterop({
      monitoring,
      secretsManager,
      resolverMiddlewares,
      projectionMiddlewares,
    }),
    viewModelsInterop: domainInterop.viewModelDomain.acquireViewModelsInterop({
      monitoring,
      eventstore: eventstoreAdapter,
      secretsManager,
    }),
  })

  const executeSaga = createSagaExecutor({
    invokeBuildAsync,
    applicationName: eventSubscriberScope,
    executeCommand,
    executeQuery,
    eventstoreAdapter,
    secretsManager,
    readModelConnectors,
    performanceTracer,
    getVacantTimeInMillis,
    uploader,
    scheduler,
    monitoring,
    domainInterop,
    executeSchedulerCommand,
  })

  const eventSubscriber = createEventSubscriber(resolve)

  Object.assign<Resolve, Partial<Resolve>>(resolve, {
    isInitialized: true,
    executeCommand,
    executeQuery,
    executeSaga,
    executeSchedulerCommand,
    notifyEventSubscribers,
  })

  resolve.eventSubscriber = eventSubscriber

  process.env.RESOLVE_LOCAL_TRACE_ID = crypto
    .randomBytes(Math.ceil(32 / 2))
    .toString('hex')
    .slice(0, 32)
}

export default initResolve
