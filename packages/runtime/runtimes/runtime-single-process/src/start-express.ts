import {
  createRuntime,
  bootstrap,
  invokeFilterErrorTypes,
  mainHandler,
  createUserResolve,
} from '@resolve-js/runtime-base'
import { EventstoreResourceAlreadyExistError } from '@resolve-js/eventstore-base'
import { ExpressAppData } from './express-app-factory'
import { wrapApiHandler } from './wrap-api-handler'

import type {
  Runtime,
  RuntimeFactoryParameters,
  BuildTimeConstants,
} from '@resolve-js/runtime-base'

type StartParameters = {
  upstream: boolean
  host: string
  port: string
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
    await runtime.eventListenersManager.bootstrapAll(true)
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
