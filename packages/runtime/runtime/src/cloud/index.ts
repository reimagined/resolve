import 'source-map-support/register'

import debugLevels from '@resolve-js/debug-levels'
import {
  escapeId,
  escapeStr,
  executeStatement,
} from 'resolve-cloud-common/postgres'
import { invokeFunction } from 'resolve-cloud-common/lambda'
import { errorBoundary } from 'resolve-cloud-common/utils'
import { initDomain } from '@resolve-js/core'

import initPerformanceTracer from './init-performance-tracer'
import lambdaWorker from './lambda-worker'
import wrapTrie from '../common/wrap-trie'
import initUploader from './init-uploader'
import gatherEventListeners from '../common/gather-event-listeners'
import getSubscribeAdapterOptions from './get-subscribe-adapter-options'

import type { Assemblies, BuildTimeConstants, Resolve } from '../common/types'
import type { PerformanceSubsegment } from '@resolve-js/core'

const log = debugLevels('resolve:runtime:cloud-entry')

const index = async ({
  assemblies,
  constants,
  domain,
  resolveVersion,
}: {
  assemblies: Assemblies
  constants: BuildTimeConstants
  domain: Resolve['domain']
  resolveVersion: string
}) => {
  let subSegment: PerformanceSubsegment | null = null

  log.debug(`starting lambda 'cold start'`)
  const domainInterop = initDomain(domain)

  try {
    log.debug('configuring reSolve framework')
    const resolve: Partial<Resolve> = {
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      domain,
      ...constants,
      publisher: {},
      assemblies,
      domainInterop,
      eventListeners: gatherEventListeners(domain, domainInterop),
      eventSubscriberScope: process.env.RESOLVE_DEPLOYMENT_ID,
      upstream: true,
      resolveVersion,
      performanceTracer: await initPerformanceTracer(),
    }

    log.debug('preparing performance tracer')

    const segment = (resolve as Resolve).performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

    resolve.getSubscribeAdapterOptions = getSubscribeAdapterOptions
    resolve.routesTrie = wrapTrie(
      domain.apiHandlers,
      constants.staticRoutes,
      constants.rootPath
    )

    log.debug('preparing uploader')
    await initUploader(resolve as Resolve)

    resolve.sendReactiveEvent = async (event) => {
      const { aggregateId, type } = event
      const databaseNameAsId = escapeId(
        process.env.RESOLVE_EVENT_STORE_DATABASE_NAME as string
      )
      const subscriptionsTableNameAsId = escapeId(
        process.env.RESOLVE_SUBSCRIPTIONS_TABLE_NAME as string
      )

      const connectionIdsResult = await executeStatement({
        Region: process.env.AWS_REGION as string,
        ResourceArn: process.env.RESOLVE_EVENT_STORE_CLUSTER_ARN as string,
        SecretArn: process.env.RESOLVE_USER_SECRET_ARN as string,
        Sql: `SELECT "connectionId" FROM ${databaseNameAsId}.${subscriptionsTableNameAsId}
          WHERE (
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."eventTypes" #>
             ${escapeStr(`{${JSON.stringify(type)}}`)} =
             CAST('true' AS jsonb)
            OR
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."eventTypes" #> '{}' =
             CAST('null' AS jsonb) 
            ) AND (
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."aggregateIds" #>
             ${escapeStr(`{${JSON.stringify(aggregateId)}}`)} =
             CAST('true' AS jsonb)
            OR
             ${databaseNameAsId}.${subscriptionsTableNameAsId}."aggregateIds" #> '{}' =
             CAST('null' AS jsonb) 
          )`,
      })

      const errors: any[] = []

      await Promise.all(
        connectionIdsResult.map(({ connectionId }) =>
          invokeFunction({
            Region: process.env.AWS_REGION as string,
            FunctionName: process.env.RESOLVE_WEBSOCKET_LAMBDA_ARN as string,
            Payload: {
              type: 'send',
              connectionId,
              data: {
                type: 'events',
                payload: {
                  events: [event],
                },
              },
            },
          }).catch(errorBoundary(errors))
        )
      )
      if (errors.length > 0) {
        log.warn(`Failed push event to websocket. ${errors}`)
      }
    }

    log.debug(`lambda 'cold start' succeeded`)

    return lambdaWorker.bind(null, resolve as Resolve)
  } catch (error) {
    log.error(`lambda 'cold start' failure`, error)
    if (subSegment != null) subSegment.addError(error)
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

export default index
