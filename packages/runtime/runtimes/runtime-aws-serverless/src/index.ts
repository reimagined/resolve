import 'source-map-support/register'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interopRequireDefault from '@babel/runtime/helpers/interopRequireDefault'
import fs from 'fs'

import type { RuntimeWorker, RuntimeAssemblies } from '@resolve-js/runtime-base'
import type { PerformanceSubsegment } from '@resolve-js/core'

import { initDomain } from '@resolve-js/core'
import {
  createCompositeMonitoringAdapter,
  gatherEventListeners,
  wrapTrie,
  getLog,
} from '@resolve-js/runtime-base'

import { performanceTracerFactory } from './performance-tracer-factory'
import { lambdaWorker } from './lambda-worker'
import { uploaderFactory } from './uploader-factory'
import { getReactiveSubscriptionFactory } from './get-reactive-subscription-factory'
import { getDeploymentId } from './utils'
import { sendReactiveEvent } from './send-reactive-event'
import { prepareAssemblies } from './prepare-assemblies'
import type {
  WorkerArguments,
  LambdaColdStartContext,
  WorkerResult,
} from './types'

const log = getLog('aws-serverless-entry')

const initLambdaWorker = async (
  serverAssemblies: RuntimeAssemblies
): Promise<RuntimeWorker<WorkerArguments, WorkerResult>> => {
  const { constants, domain, resolveVersion } = serverAssemblies
  const assemblies = prepareAssemblies(
    serverAssemblies.assemblies,
    serverAssemblies
  )
  let subSegment: PerformanceSubsegment | null = null

  log.debug(`starting lambda 'cold start'`)
  const domainInterop = initDomain(domain)

  try {
    log.debug('building lambda cold start context entries')
    const performanceTracer = await performanceTracerFactory()
    const monitoring = createCompositeMonitoringAdapter(
      assemblies.monitoringAdapters
    )

    const segment = performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

    const uploader = await uploaderFactory({
      uploaderAdapterFactory: assemblies.uploadAdapter,
    })
    const getReactiveSubscription = getReactiveSubscriptionFactory()

    const coldStartContext: LambdaColdStartContext = {
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
    }

    log.debug(`lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, coldStartContext)
  } catch (error) {
    log.error(`lambda 'cold start' failure`, error)
    if (subSegment != null) subSegment.addError(error)
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
  return async () => {
    throw Error(`Lambda worker was not created due to cold start failure`)
  }
}

let maybeLambdaWorkerPromise: Promise<Function> | null = null
const main = async (...args: any[]) => {
  try {
    if (maybeLambdaWorkerPromise == null) {
      const handlerPath = `${process.env.LAMBDA_TASK_ROOT}/cloud-entry.js`
      if (handlerPath == null || !fs.existsSync(handlerPath)) {
        throw new Error(`Entry "${handlerPath}" is not provided`)
      }
      process.env.__RUNTIME_ENTRY_PATH = handlerPath

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serverAssemblies = interopRequireDefault(require(handlerPath))
        .default

      maybeLambdaWorkerPromise = initLambdaWorker(serverAssemblies)
    }
    const worker = await maybeLambdaWorkerPromise

    return await worker(...args)
  } catch (error) {
    log.error('Lambda handler fatal error: ', error)
    throw error
  }
}

export default main
