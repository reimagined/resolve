# **resolve-readmodel-base**
[![npm version](https://badge.fury.io/js/resolve-readmodel-base.svg)](https://badge.fury.io/js/resolve-readmodel-base)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-readmodel-base-readme?pixel)

A base package for interchangeable **Read Model Adapter** with identical query API for projection and resolvers. One adapter instance can serve multiple read-models, depend on their unique names. Adapter internally supports queue for database requests and transaction and locking mechanism, if provided by underlying database.

## Available Parameters

* `implementation` - object with bindings to underlying database, including connection establishment, user-defined and meta-tables/collections managment, queries queue organization and transaction/locking mechanisms - see any existing adapter to examine full list of bindings. 
* `options` - extracts `metaName` and `tablePrefix` fields if exists, all other fields are passed into underlying implementation as-is in `connect` function; `metaName` and `tablePrefix` attached to object passed in implementation, but filled with default values if not set explicitely as "__ResolveMeta__" and empty string respectively.

## Adapter Instance Interface

* `bindReadModel` - bind provided read-model and returns executor, used for reading and updating read-model by events; read-models are segregated by names (`readModelName`) and only one simultaneous non-disposed executor for one read-model is allowed. 
* `dispose` - disposes adapter and disconnects underlying database connection if exists, can have additional parameters, passed to implementation as-is.

## Read-model Executor Interface

* `getLastError` - if projection building, invoked by `updateByEvents` had been crashed in customer projection code with exeption, it will be available via this function invokation; if no - returns null. 
* `updateByEvents` - invoke projection with passed events and perform all subsequent tasks - manage transaction, lock unique read-model instance, update meta-tables and check duplicate and out-of-order events; if last read-model access time greater that one hour - do nothing (aka `on-demand` mode).
* `readAndSerialize` - invoke `read` with serializing result via `JSON.stringify`.
* `read` - invoke selected resolver with passed arguments and update last access time for read-model.
* `dispose` - drop read-model with data and meta information and dispose current executor.

## Usage

```js
import createAdapter from 'resolve-readmodel-base'
import eventStore from './eventstore-instance'

const implementation = {
  metaApi: {
    async connect(pool, connectionOptions) {},
    async reportDemandAccess(pool, readModelName) {},
    async pollDemandAccess(pool, readModelName) {},
    async checkAndAcquireSequence(pool, readModelName, aggregateId, aggregateVersion, maybeUnordered) {},
    async checkEventProcessed(pool, readModelName, aggregateId, aggregateVersion) {},
    async getLastTimestamp(pool, readModelName) {},
    async setLastTimestamp(pool, readModelName, timestamp) {},
    async beginTransaction(pool, readModelName, onlyLocal) {},
    async commitTransaction(pool, readModelName, onlyLocal) {},
    async rollbackTransaction(pool, readModelName, onlyLocal) {},
    async tableExists(pool, readModelName, tableName) {},
    async getTableInfo(pool, readModelName, tableName) {},
    async describeTable(pool, readModelName, tableName, metaSchema) {},
    async dropReadModel(pool, readModelName) {},
    async disconnect(pool) {},
    async drop(pool, dropOptions) {}
  },
  storeApi: {
    async defineTable(pool, readModelName, tableName, tableDescription) {},
    async find(pool, readModelName, tableName, searchExpression, fieldList, sort, skip, limit) {},
    async findOne(pool, readModelName, tableName, searchExpression, fieldList) {},
    async count(pool, readModelName, tableName, searchExpression) {},
    async insert(pool, readModelName, tableName, document) {},
    async update(pool, readModelName, tableName, searchExpression, updateExpression, upsertOptions) {},
    async del(pool, readModelName, tableName, searchExpression) {}
  }
}

const options = {
  metaName: 'META_TABLE_OR_COLLECTION_NAME',
  tablePrefix: 'TABLE_OR_COLLECTION_PREFIX',
  ...customConnectionOptions
}

const adapter = createAdapter(
  implementation,
  options
)

const readModel = {
  readModelName: 'read-model-name',
  projection: {
    async FIRST_EVENT_TYPE(store, event) {},
    async SECOND_EVENT_TYPE(store, event) {}
  },
  resolvers: {
    async userResolverName(store, args) {}
  },
  eventStore
}

const readModelExecutor = adapter.bindReadModel(readModel)

const readResult = readModelExecutor.read({
  resolverName: 'userResolverName',
  resolverArgs: {}
})

const serializedReadResult = readModelExecutor.readAndSerialize({
  resolverName: 'userResolverName',
  resolverArgs: {}
})

await readModelExecutor.updateByEvents([
  { 
    type: 'FIRST_EVENT_TYPE',
    aggregateId: 'A1',
    aggregateVersion: 1,
    timestamp: 1,
    payload: {}
  },
  { 
    type: 'SECOND_EVENT_TYPE',
    aggregateId: 'A2',
    aggregateVersion: 2,
    timestamp: 2,
    payload: {}
  }
])

await readModelExecutor.dispose()

await adapter.dispose()

```