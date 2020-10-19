import 'source-map-support/register'
import { invokeFunction } from 'resolve-cloud-common/lambda'
import debugLevels from 'resolve-debug-levels'

import initAwsClients from './init-aws-clients'
import initBroker from './init-broker'
import initPerformanceTracer from './init-performance-tracer'
import lambdaWorker from './lambda-worker'
import wrapTrie from '../common/wrap-trie'
import initUploader from './init-uploader'

const log = debugLevels('resolve:resolve-runtime:cloud-entry')

const index = async ({ assemblies, constants, domain }) => {
  let subSegment = null

  log.debug(`starting lambda 'cold start'`)
  try {
    log.debug('configuring reSolve framework')
    const resolve = {
      seedClientEnvs: assemblies.seedClientEnvs,
      serverImports: assemblies.serverImports,
      ...domain,
      ...constants,
      routesTrie: wrapTrie(domain.apiHandlers, constants.rootPath),
      publisher: {},
      assemblies,
    }

    log.debug('preparing performance tracer')
    await initPerformanceTracer(resolve)

    const segment = resolve.performanceTracer.getSegment()
    subSegment = segment.addNewSubsegment('initResolve')

    log.debug('preparing aws clients')
    await initAwsClients(resolve)

    log.debug('preparing event broker')
    await initBroker(resolve)

    log.debug('preparing uploader')
    await initUploader(resolve)

    resolve.invokeEventBusAsync = async (
      eventSubscriber,
      method,
      parameters
    ) => {
      await invokeFunction({
        FunctionName: resolve.invokedFunctionArn,
        InvocationType: 'Event',
        Region: process.env.AWS_REGION,
        Payload: {
          resolveSource: 'EventBusDirect',
          method,
          payload: {
            eventSubscriber,
            ...parameters,
          },
        },
      })
    }

    resolve.sendReactiveEvent = async (event) => {
      const eventDescriptor = {
        topic: `${process.env.RESOLVE_DEPLOYMENT_ID}/${event.type}/${event.aggregateId}`,
        payload: JSON.stringify(event),
        qos: 1,
      }

      await resolve.mqtt.publish(eventDescriptor).promise()
    }

    resolve.eventSubscriberCredentials = {
      get applicationLambdaArn() {
        return resolve.invokedFunctionArn
      },
      lambdaEventName: 'resolveSource',
      lambdaEventType: 'EventBus',
      mode: 'internal',
    }

    resolve.subscriptionsCredentials = {
      get applicationLambdaArn() {
        return resolve.invokedFunctionArn
      },
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
