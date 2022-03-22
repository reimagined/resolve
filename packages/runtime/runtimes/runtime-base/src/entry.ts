import { initDomain } from '@resolve-js/core'
import type { EventSubscriber, Eventstore, UnPromise } from './types'
import { createCompositeMonitoringAdapter } from './create-composite-monitoring-adapter'
import { createRuntime } from './create-runtime'
import { gatherEventListeners } from './gather-event-listeners'
import { wrapTrie } from './wrap-trie'
import { getLog } from './utils/get-log'

const entry = (serverAssemblies: any) => (runtimeSpecificPool: any) => {
  const { assemblies: inputAssemblies, constants, domain, resolveVersion } = serverAssemblies
  const {
    overrideEventStoreAdapter,
    overrideDefaultReadModelAdapter,
    performanceTracer,
    getDeploymentId,
    getReactiveSubscription,
    sendReactiveEvent,
    getVacantTimeInMillis,
    uploader,
    scheduler
  } = runtimeSpecificPool
  const domainInterop = initDomain(domain)
  const assemblies = {
    ...inputAssemblies, 
    ...(overrideEventStoreAdapter != null ? { eventstoreAdapter: overrideEventStoreAdapter } : {}),
    readModelConnectors: {
      ...inputAssemblies.readModelConnectors,
      ...(overrideDefaultReadModelAdapter != null ? { default: overrideDefaultReadModelAdapter }: {})
    }
  }

  const monitoring = createCompositeMonitoringAdapter(
    assemblies.monitoringAdapters
  )
  const runtimeInitializer = Object.freeze({
    seedClientEnvs: assemblies.seedClientEnvs,
    serverImports: assemblies.serverImports,
    domain,
    ...constants,
    assemblies,
    domainInterop,
    eventListeners: gatherEventListeners(domain, domainInterop),
    eventSubscriberScope: getDeploymentId(),
    upstream: true,
    resolveVersion,
    performanceTracer,
    monitoring,
    getReactiveSubscription,
    sendReactiveEvent,
    routesTrie: wrapTrie(
      domain.apiHandlers,
      constants.staticRoutes,
      constants.rootPath
    ),
    uploader,
    constants,
  })

  const api = Object.freeze({
    async buildEventSubscriber (...params: Parameters<EventSubscriber["build"]>) : Promise<UnPromise<ReturnType<EventSubscriber["build"]>>> {
      let runtime: UnPromise<ReturnType<typeof createRuntime>> | null = null
      try {
        runtime = await createRuntime(runtimeInitializer)
        return await runtime.eventSubscriber.build(...params)
      } finally {
        if(runtime != null) {
          await runtime.dispose()
        } 
      }
    },
    async executeScheduler (data: any) {
      const log = getLog('executingEntries')
      let runtime: UnPromise<ReturnType<typeof createRuntime>> | null = null
      try {
          runtime = await createRuntime(runtimeInitializer)
          log.debug(`executing scheduled entries`)
          log.verbose(`data: ${JSON.stringify(data)}`)
          const schedulerName = domainInterop.sagaDomain.schedulerName
          const entries = [].concat(data)
          try {
            log.debug(`executing tasks`)
            await Promise.all(
              entries.map(({ taskId, date, command }) =>
                runtime!.executeSchedulerCommand({
                  aggregateName: schedulerName,
                  aggregateId: taskId,
                  type: 'execute',
                  payload: { date, command },
                })
              )
            )
            log.debug(`tasks were successfully executed`)
          } catch (e) {
            log.error(e.message)
            throw e
          }
      } finally {
        if(runtime != null) {
          await runtime.dispose()
        } 
      }
    },
    
    async loadEvents (...params: Parameters<Eventstore["loadEvents"]>) : Promise<UnPromise<ReturnType<Eventstore["loadEvents"]>>> {
      let runtime: UnPromise<ReturnType<typeof createRuntime>> | null = null
      try {
        runtime = await createRuntime(runtimeInitializer)
        return await runtime.eventStoreAdapter.loadEvents(...params)
      } finally {
        if(runtime != null) {
          await runtime.dispose()
        } 
      }
    },

    async executeHttp (req: any, res: any) {

    },

  })

  return api
}

export default entry
