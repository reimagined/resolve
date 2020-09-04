import SQLite from 'sqlite'
import fs from 'fs'
import os from 'os'
import tmp from 'tmp'
import { createServer } from 'resolve-local-rpc'

// broker
import subscribe from './broker/subscribe'
import unsubscribe from './broker/unsubscribe'
import resubscribe from './broker/resubscribe'
import acknowledge from './broker/acknowledge'
import publish from './broker/publish'
import status from './broker/status'
import resume from './broker/resume'
import pause from './broker/pause'
import reset from './broker/reset'
import interopProperty from './broker/interop-property'
import read from './broker/read'

// functions
import acknowledgeBatch from './core/acknowledge-batch'
import checkCursorEdge from './core/check-cursor-edge'
import createAndInitPublisher from './core/create-and-init-publisher'
import deliverBatchForSubscriber from './core/deliver-batch-for-subscriber'
import finalizeAndReportBatch from './core/finalize-and-report-batch'
import generateGuid from './core/generate-guid'
import getNextCursor from './core/get-next-cursor'
import invokeConsumer from './core/invoke-consumer'
import invokeOperation from './core/invoke-operation'
import parseSubscription from './core/parse-subscription'
import pullNotificationsAsBatchForSubscriber from './core/pull-notifications-as-batch-for-subscriber'
import pushNotificationAndGetSubscriptions from './core/push-notification-and-get-subscriptions'
import requestTimeout from './core/request-timeout'
import resumeSubscriber from './core/resume-subscriber'
import serializeError from './core/serialize-error'

import connectDatabase from './connect-database'
import multiplexAsync from '../multiplex-async'

// lifecycle
import createDatabase from './lifecycle/create-database'
import dropDatabase from './lifecycle/drop-database'

export default createAndInitPublisher.bind(null, {
  imports: {
    SQLite,
    fs,
    os,
    tmp,
  },
  functions: {
    acknowledgeBatch,
    checkCursorEdge,
    createAndInitPublisher,
    deliverBatchForSubscriber,
    finalizeAndReportBatch,
    generateGuid,
    getNextCursor,
    invokeConsumer,
    invokeOperation,
    parseSubscription,
    pullNotificationsAsBatchForSubscriber,
    pushNotificationAndGetSubscriptions,
    requestTimeout,
    resumeSubscriber,
    serializeError,

    createServer,
    connectDatabase,
    multiplexAsync,
  },
  lifecycle: {
    createDatabase,
    dropDatabase,
  },
  broker: {
    subscribe,
    unsubscribe,
    resubscribe,
    acknowledge,
    publish,
    status,
    resume,
    pause,
    reset,
    interopProperty,
    read,
  },
})
