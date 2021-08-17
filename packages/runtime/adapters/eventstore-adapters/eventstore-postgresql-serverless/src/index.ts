// eslint-disable-next-line import/no-extraneous-dependencies
import RDSDataService from 'aws-sdk/clients/rdsdataservice'
import createAdapter from '@resolve-js/eventstore-base'

import loadEventsByCursor from './load-events-by-cursor'
import loadEventsByTimestamp from './load-events-by-timestamp'
import freeze from './freeze'
import unfreeze from './unfreeze'
import getLatestEvent from './get-latest-event'
import saveEvent from './save-event'
import fullJitter from './full-jitter'
import executeStatement from './execute-statement'
import injectEvent from './inject-event'
import injectEvents from './inject-events'
import coercer from './coercer'
import escapeId from './escape-id'
import escape from './escape'
import shapeEvent from './shape-event'
import loadSnapshot from './load-snapshot'
import saveSnapshot from './save-snapshot'
import dropSnapshot from './drop-snapshot'
import beginIncrementalImport from './begin-incremental-import'
import commitIncrementalImport from './commit-incremental-import'
import rollbackIncrementalImport from './rollback-incremental-import'
import pushIncrementalImport from './push-incremental-import'
import ensureEventSubscriber from './ensure-event-subscriber'
import removeEventSubscriber from './remove-event-subscriber'
import getEventSubscribers from './get-event-subscribers'

import connect from './connect'
import initEvents from './init-events'
import initSecrets from './init-secrets'
import initFinal from './init-final'
import dropEvents from './drop-events'
import dropSecrets from './drop-secrets'
import dropFinal from './drop-final'
import dispose from './dispose'
import deleteSecret from './delete-secret'
import setSecret from './set-secret'
import getSecret from './get-secret'
import injectSecret from './inject-secret'
import loadSecrets from './load-secrets'

import replicateEvents from './replicate-events'
import replicateSecrets from './replicate-secrets'
import setReplicationStatus from './set-replication-status'
import setReplicationIterator from './set-replication-iterator'
import setReplicationPaused from './set-replication-paused'
import getReplicationState from './get-replication-state'
import resetReplication from './reset-replication'
import getCursorUntilEventTypes from './get-cursor-until-event-types'
import describe from './describe'

import _createResource from './resource/create'
import _destroyResource from './resource/destroy'

import type {
  CloudResourcePool,
  CloudResourceOptions,
  ConnectionDependencies,
  PostgresqlAdapterConfig,
} from './types'
import type { Adapter } from '@resolve-js/eventstore-base'

const createPostgresqlServerlessAdapter = (
  options: PostgresqlAdapterConfig
): Adapter => {
  return createAdapter(
    {
      connect,
      loadEventsByCursor,
      loadEventsByTimestamp,
      getLatestEvent,
      saveEvent,
      initEvents,
      initSecrets,
      initFinal,
      dropEvents,
      dropSecrets,
      dropFinal,
      dispose,
      freeze,
      unfreeze,
      shapeEvent,
      deleteSecret,
      getSecret,
      setSecret,
      loadSnapshot,
      saveSnapshot,
      dropSnapshot,
      beginIncrementalImport,
      commitIncrementalImport,
      rollbackIncrementalImport,
      pushIncrementalImport,
      ensureEventSubscriber,
      removeEventSubscriber,
      getEventSubscribers,
      injectEvent,
      injectEvents,
      injectSecret,
      loadSecrets,
      replicateEvents,
      replicateSecrets,
      setReplicationStatus,
      setReplicationIterator,
      setReplicationPaused,
      getReplicationState,
      resetReplication,
      getCursorUntilEventTypes,
      describe,
    },
    {
      RDSDataService,
      escapeId,
      escape,
      fullJitter,
      executeStatement,
      coercer,
    },
    options
  )
}

export default createPostgresqlServerlessAdapter

const cloudPool: CloudResourcePool = {
  executeStatement,
  connect,
  RDSDataService,
  escapeId,
  escape,
  fullJitter,
  coercer,
  dispose,
  shapeEvent,
}

const createResource = _createResource.bind(null, cloudPool)
const destroyResource = _destroyResource.bind(null, cloudPool)

Object.assign(cloudPool, {
  createResource,
  destroyResource,
})

export { createResource as create, destroyResource as destroy }

export type { PostgresqlAdapterConfig, CloudResourcePool, CloudResourceOptions }
