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

const log = debugLevels('resolve:runtime:cloud-entry')

const index = async ({ assemblies, constants, domain, resolveVersion }) => {
  let subSegment = null

  log.debug(`starting lambda 'cold start'`)
  const domainInterop = initDomain(domain)

  try {
    log.debug('configuring reSolve framework')
    const resolve = {
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      domain,
      ...constants,
      routesTrie: wrapTrie(domain.apiHandlers, constants.rootPath),
      publisher: {},
      assemblies,
      domainInterop,
      eventListeners: gatherEventListeners(domain, domainInterop),
      eventSubscriberScope: process.env.RESOLVE_DEPLOYMENT_ID,
      upstream: true,
      resolveVersion,
    }

    log.debug('preparing performance tracer')
    await initPerformanceTracer(resolve)

    const segment = resolve.performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

    Object.defineProperties(resolve, {
      getSubscribeAdapterOptions: {
        value: getSubscribeAdapterOptions,
      },
    })

    log.debug('preparing uploader')
    await initUploader(resolve)

    resolve.sendReactiveEvent = async (event) => {
      const { aggregateId, type } = event
      const databaseNameAsId = escapeId(
        process.env.RESOLVE_EVENT_STORE_DATABASE_NAME
      )
      const subscriptionsTableNameAsId = escapeId(
        process.env.RESOLVE_SUBSCRIPTIONS_TABLE_NAME
      )

      const connectionIdsResult = await executeStatement({
        Region: process.env.AWS_REGION,
        ResourceArn: process.env.RESOLVE_EVENT_STORE_CLUSTER_ARN,
        SecretArn: process.env.RESOLVE_USER_SECRET_ARN,
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

      const errors = []

      await Promise.all(
        connectionIdsResult.map(({ connectionId }) =>
          invokeFunction({
            Region: process.env.AWS_REGION,
            FunctionName: process.env.RESOLVE_WEBSOCKET_LAMBDA_ARN,
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

    return lambdaWorker.bind(null, resolve)
  } catch (error) {
    log.error(`lambda 'cold start' failure`, error)
    subSegment.addError(error)
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
}

export default index
