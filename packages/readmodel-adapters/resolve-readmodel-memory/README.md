
# **resolve-readmodel-memory** [![npm version](https://badge.fury.io/js/resolve-readmodel-memory.svg)](https://badge.fury.io/js/resolve-readmodel-memory)

This package is a `resolve-query` adapter for storing a read model in memory. The adapter is based on key/value store interface, provided by ES6 `Map` object, and does not have binary dependencies.

The store interface, implemented using the `resolve-readmodel-memory` adapter, provides segregated read and write access to collections. Write access is used on the update side when projection functions fill collections with data. Read access is used on the read endpoint where the client side retrieves collection data (for example, in a graphql resolver).

A store in the read mode provides the following asynchronous methods:
* `hget(key, field)` - gets the value associated with `field` in the stored at `key`.

A store in the write mode supports all read mode methods and additionally provides the following asynchronous methods:
* `hset(key, field, value)` - sets the value associated with `field` in the stored at `key`
* `del(key)` - delete the existing `key`, it is ignored if `key` does not exist.


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
            await store.hset('Test', 'myField', { changeCount: 0, text: 'Initial' })
        },
        TestEvent: async (store, event) => {
            const value = await store.hget('Test', 'myField');

            const newValue = { 
                changeCount: value.changeCount,
                text: event.text
            };
            await store.hset('Test', 'myField', newValue);
        }
    }
)

const store = await executeReadModel();
const value = store.hget('Test', 'myField');
console.log(value)

```
