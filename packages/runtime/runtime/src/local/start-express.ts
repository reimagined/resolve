import { createRuntime, Runtime } from '../common/create-runtime'
import { bootstrap } from '../common/bootstrap'
import invokeFilterErrorTypes from '../common/utils/invoke-filter-error-types'

import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { ExpressAppData } from './express-app-factory'
import { RuntimeFactoryParameters } from '../common/create-runtime'
import { wrapApiHandler } from './wrap-api-handler'
import { mainHandler } from '../common/handlers/main-handler'
import { BuildTimeConstants, createUserResolve } from '../common'

type StartParameters = {
  upstream: boolean
  host: string
  port: string
  getEventSubscriberDestination: (name: string) => string
  ensureQueue: (name?: string) => Promise<void>
  deleteQueue: (name?: string) => Promise<void>
  buildTimeConstants: BuildTimeConstants
}

export const startExpress = async (
  data: ExpressAppData,
  startParams: StartParameters,
  runtimeParams: RuntimeFactoryParameters
) => {
  const {
    server,
    staticRouteMarkerHandler,
    expressStaticMiddleware,
    routesTrie,
    app,
    staticRoutes,
  } = data

  app.use(async (req, res, next) => {
    if (staticRoutes != null) {
      const { node } = routesTrie.match(req.path) ?? { node: null }
      if (node != null) {
        const handler = node.getHandler(req.method.toUpperCase())
        const maybeMappedStaticFile = (staticRoutes.find(
          (route) => route[0] === node.pattern
        ) ?? [])[1]
        if (handler === staticRouteMarkerHandler) {
          return await expressStaticMiddleware(
            maybeMappedStaticFile != null
              ? Object.create(req, {
                  originalUrl: {
                    value: `/${maybeMappedStaticFile}`,
                    enumerable: true,
                  },
                  url: { value: `/${maybeMappedStaticFile}`, enumerable: true },
                  path: {
                    value: `/${maybeMappedStaticFile}`,
                    enumerable: true,
                  },
                  params: { value: {}, enumerable: true },
                  query: { value: {}, enumerable: true },
                })
              : req,
            res,
            next
          )
        }
      }
    }

    let runtime: Runtime | null = null
    try {
      runtime = await createRuntime(runtimeParams)
      const userResolve = createUserResolve(runtime, {
        constants: startParams.buildTimeConstants,
        routesTrie: routesTrie,
        domain: runtimeParams.domain,
        domainInterop: runtimeParams.domainInterop,
        eventSubscriberScope: runtimeParams.eventSubscriberScope,
        performanceTracer: runtimeParams.performanceTracer,
        seedClientEnvs: runtimeParams.seedClientEnvs,
        eventListeners: runtimeParams.eventListeners,
      })

      const getCustomParameters = async () => ({
        resolve: userResolve,
      })

      const executor = wrapApiHandler(mainHandler, getCustomParameters)

      await executor(req, res)
    } finally {
      if (runtime != null) {
        await runtime.dispose()
      }
    }
  })

  let runtime: Runtime | null = null
  try {
    runtime = await createRuntime(runtimeParams)
    const { eventStoreAdapter } = runtime

    await invokeFilterErrorTypes(
      eventStoreAdapter.init.bind(eventStoreAdapter),
      [EventstoreResourceAlreadyExistError]
    )

    await bootstrap({
      eventSubscriber: runtime.eventSubscriber,
      eventStoreAdapter: runtime.eventStoreAdapter,
      upstream: startParams.upstream,
      ensureQueue: startParams.ensureQueue,
      deleteQueue: startParams.deleteQueue,
      getEventSubscriberDestination: startParams.getEventSubscriberDestination,
      eventListeners: runtimeParams.eventListeners,
      eventSubscriberScope: runtimeParams.eventSubscriberScope,
    })

    const notReadyListeners = new Set([...runtimeParams.eventListeners.keys()])

    while (startParams.upstream && notReadyListeners.size > 0) {
      for (const eventSubscriber of notReadyListeners) {
        const {
          successEvent,
          failedEvent,
          errors,
          status,
        } = await runtime.eventSubscriber.status({ eventSubscriber })

        if (
          successEvent != null ||
          failedEvent != null ||
          (Array.isArray(errors) && errors.length > 0) ||
          status !== 'deliver'
        ) {
          notReadyListeners.delete(eventSubscriber)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  } finally {
    if (runtime != null) {
      await runtime.dispose()
    }
  }

  await new Promise<void>((resolve, reject) => {
    const errorHandler = (err: any) => reject(err)
    server.once('error', errorHandler)
    server.listen(Number(startParams.port), startParams.host, () => {
      server.removeListener('error', errorHandler)

      // eslint-disable-next-line no-console
      console.log(`Application listening on port ${startParams.port}!`)
      resolve()
    })
  })
}
