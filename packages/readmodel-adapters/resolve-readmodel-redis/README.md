
# **resolve-readmodel-redis** [![npm version](https://badge.fury.io/js/resolve-readmodel-redis.svg)](https://badge.fury.io/js/resolve-readmodel-redis)

This package is a `resolve-query` adapter for storing a read model in [Redis](https://redis.io/) store. The adapter is based on the [Redis client](https://github.com/NodeRedis/node_redis).

The store interface is implemented using the `resolve-readmodel-redis` adapter and provides segregated read and write access:
- Read access is used to retrieve data from store (for example, by a graphql resolver). The package provides the `hget(key, field)` asynchronous method to get the value associated with the `field` from the hash stored at `key`.
- Write access is used by the projection functions to update data. The following asynchronous methods are available:
    * `hset(key, field, value)` - sets the `value` associated with the `field` in the hash stored at `key`;
    * `del(key)` - deletes the hash stored at `key`. Does nothing if the `key` does not exist.

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
                changeCount: value.changeCount + 1,
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
