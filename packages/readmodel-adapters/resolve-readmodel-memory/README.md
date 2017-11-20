# **resolve-readmodel-memory** [![npm version](https://badge.fury.io/js/resolve-readmodel-memory.svg)](https://badge.fury.io/js/resolve-readmodel-memory)

This package is a `resolve-query` adapter for storing a read model in memory. Adapter based on [NeDB](https://github.com/louischatriot/nedb) memory database and does not have binary dependencies. API is a subset of [MongoDB query language](https://docs.mongodb.com/manual/tutorial/query-documents/) and has good perfomance and full backward compatibility. Package `resolve-readmodel-memory` is useful for local development purposes before deploy on MongoDB instance.

Store interface, implemented by `resolve-readmodel-memory` adapter, provides segregated read and write access to collections. Write access used on update side, when collections are filled with data by projection functions. Read access is used on read endpoint, where collection data are retrieved by client side, for example, in graphql resolver.

Store has following asynchronous methods:
* `collection` - get collection by name; if collection does not exists, in write mode it will be created, and in read mode error will be thrown.
* `getCollections` - retrieves actual collection names list, works identical in read & write modes.

Collection in read model provides following asynchronous methods:
* `find` - selects documents in a collection, like [find](https://docs.mongodb.com/manual/reference/method/db.collection.find/) method in mongodb collections. Modifying selection behavior also supported with `sort`, `skip`, `limit` and `projection` methods, like in mongodb [cursor equalent methods](https://docs.mongodb.com/manual/reference/method/db.collection.find/#modify-the-cursor-behavior); query also supports [modifiers operators](https://docs.mongodb.com/manual/reference/operator/query-modifier/).
* `findOne` - returns one document that satisfies the specified query criteria on the collection, like [findOne](https://docs.mongodb.com/manual/reference/method/db.collection.findOne/) method.
* `count` - returns the count of documents that would match a find() query for the collection, like [count](https://docs.mongodb.com/manual/reference/method/db.collection.count/) method.

Collection in write supports all read-model methods and provides additionally following asynchronous methods:
* `insert` - inserts a document or documents into a collection, like [insert](https://docs.mongodb.com/manual/reference/method/db.collection.insert/) method.
* `update` - modifies an existing document or documents in a collection, like [update](https://docs.mongodb.com/manual/reference/method/db.collection.update/l) method.
* `remove` - removes documents from a collection, like [remove](https://docs.mongodb.com/manual/reference/method/db.collection.remove/) method.
* `ensureIndex` - creates indexes on collections, like [createIndex](https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/) method.
* `removeIndex` - drops or removes the specified index from a collection, like [dropIndex](https://docs.mongodb.com/manual/reference/method/db.collection.dropIndex/) method.


## Usage

```js
import createMemoryAdapter from 'resolve-readmodel-memory';
import { createReadModel } from 'resolve-query';

const adapter = createMemoryAdapter();

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
