
# **resolve-readmodel-redis** [![npm version](https://badge.fury.io/js/resolve-readmodel-redis.svg)](https://badge.fury.io/js/resolve-readmodel-redis)

This package is a `resolve-query` adapter for storing a read model in redis. The adapter is based on the [Redis]() database and does not have binary dependencies. API is a subset of the [MongoDB query language](https://docs.mongodb.com/manual/tutorial/query-documents/).

The store interface, implemented using the `resolve-readmodel-redis` adapter, provides segregated read and write access to collections. Write access is used on the update side when projection functions fill collections with data. Read access is used on the read endpoint where the client side retrieves collection data (for example, in a graphql resolver).

A store has the following asynchronous methods:
* `collection` - gets a collection by its name; if a collection does not exists, it is created in the write mode, and an error is thrown in the read mode.
* `getCollections` - retrieves the list of actual collection names, in the read and write mode.

A collection in the read mode provides the following asynchronous methods:
* `find` - selects documents in a collection, like the MongoDB collection's [find](https://docs.mongodb.com/manual/reference/method/db.collection.find/) method. The  `sort`, `skip`, `limit` and `projection` methods support modifying selection behavior, like MongoDB's [cursor methods](https://docs.mongodb.com/manual/reference/method/db.collection.find/#modify-the-cursor-behavior). A query supports [modifier operators](https://docs.mongodb.com/manual/reference/operator/query-modifier/).
* `findOne` - returns one document that satisfies the specified query criteria in a collection, like the [findOne](https://docs.mongodb.com/manual/reference/method/db.collection.findOne/) method.
* `count` - returns the number of documents that match a `find()` query in a collection, like the [count](https://docs.mongodb.com/manual/reference/method/db.collection.count/) method.

A collection in the write mode supports all read mode methods and additionally provides the following asynchronous methods:
* `insert` - inserts a document or documents into a collection, like the [insert](https://docs.mongodb.com/manual/reference/method/db.collection.insert/) method.
* `update` - modifies an existing document or documents in a collection, like the [update](https://docs.mongodb.com/manual/reference/method/db.collection.update/) method.
* `remove` - removes documents from a collection, like the [remove](https://docs.mongodb.com/manual/reference/method/db.collection.remove/) method.
* `ensureIndex` - creates indexes in collections, like the [createIndex](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/) method.
* `removeIndex` - drops or removes the specified index from a collection, like the [dropIndex](https://docs.mongodb.com/manual/reference/method/db.collection.dropIndex/) method.


## Usage

```js
import createRedisAdapter from 'resolve-readmodel-redis';
import { createReadModel } from 'resolve-query';

const adapter = createRedisAdapter();

const testEventStore = {
    subscribeByEventType: (_, handler) => Promise.resolve(
        handler({ type: 'TestEvent', text: 'One' }),
        handler({ type: 'TestEvent', text: 'Two' })
    )
};

const executeReadModel = createReadModel(
    eventStore: testEventStore,
    adapter,
    projection: {
        Init: async (store) => {
            const TestCollection = await store.collection('Test');
            await TestCollection.ensureIndex({ field: 'ID' });
            await TestCollection.insert({ id: 0, text: 'Initial' })
        },
        TestEvent: async (store, event) => {
            const TestCollection = await store.collection('Test');
            const lastId = (await TestCollection.find({}).sort({ id: -1 }).limit(1))[0].id;
            await TestCollection.insert({
                id: lastId + 1,
                text: event.text
            })
        }
    }
)

const store = await executeReadModel();
const TestCollection = await store.collection('Test');
const records = await store.find({ id: { $gt: 0 } });
console.log(records)


```
