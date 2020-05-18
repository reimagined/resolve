import SQLite from 'sqlite'
import fs from 'fs'
import os from 'os'
import tmp from 'tmp'
import { getNextCursor } from 'resolve-eventstore-base'
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
import read from './broker/read'
import init from './broker/init'
import drop from './broker/drop'

// functions
import ensureOrResetSubscription from './core/ensure-or-reset-subscription'
import createAndInitPublisher from './core/create-and-init-publisher'
import acknowledgeBatch from './core/acknowledge-batch'
import deliverBatchForSubscriber from './core/deliver-batch-for-subscriber'
import finalizeAndReportBatch from './core/finalize-and-report-batch'
import pullNotificationsAsBatchForSubscriber from './core/pull-notifications-as-batch-for-subscriber'
import pushNotificationAndGetSubscriptions from './core/push-notification-and-get-subscriptions'
import manageSubscription from './core/manage-subscription'
import getSubscriberOptions from './core/get-subscriber-options'
import serializeError from './core/serialize-error'
import requestTimeout from './core/request-timeout'
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
    tmp
  },
  functions: {
    ensureOrResetSubscription,
    connectDatabase,
    getNextCursor,
    createServer,
    deliverBatchForSubscriber,
    finalizeAndReportBatch,
    acknowledgeBatch,
    pullNotificationsAsBatchForSubscriber,
    pushNotificationAndGetSubscriptions,
    getSubscriberOptions,
    manageSubscription,
    multiplexAsync,
    serializeError,
    requestTimeout
  },
  lifecycle: {
    createDatabase,
    dropDatabase
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
    read,
    init,
    drop
  }
})
