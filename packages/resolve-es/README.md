# **resolve-es**
[![npm version](https://badge.fury.io/js/resolve-es.svg)](https://badge.fury.io/js/resolve-es)

Provides an event store implementation with the capability to use different [storage](../storage-adapters) and [bus](../bus-adapters) adapters to store and emit events. 
## Usage
When initializing an event store, pass the following arguments:
* `storage`  
	Use a reSolve framework  [adapter](../storage-adapters)...
	* [resolve-storage-mongo](../storage-adapters/resolve-storage-mongo)
	* [resolve-storage-lite](../storage-adapters/resolve-storage-lite)

	... or implement a custom storage adapter. A storage adapter is an object with the following fields:
	* `loadEventsByTypes` - a function which takes three arguments: an array of event types, a callback that is called for handling each appropriate event and a timestamp specifying when to start loading events. 
	* `loadEventsByAggregateIds` - a function which takes three arguments: an aggregate id/ array of aggregate ids, a callback that is called for handling each   appropriate event and a timestamp specifying when to start loading events. 
	* `saveEvent` - a function which takes an event and returns a Promise that is resolved when the event is stored. Event should contain following required fields: `aggregateId`, `aggregateVersion` and `type`. Using `saveEvent` function in custom code is not not recommended.
	* `saveEventRaw` - like `saveEvent`, but event should contain custom `timestamp` field.


* `bus`  
	Use a reSolve framework [adapter](../bus-adapters)...
	* [resolve-bus-memory](../bus-adapters/resolve-bus-memory)
	* [resolve-bus-rabbitmq](../bus-adapters/resolve-bus-rabbitmq)
	* [resolve-bus-zmq](../bus-adapters/resolve-bus-zmq)

	... or implement a custom bus adapter. A bus adapter is an object with the following fields:
	* `subscribe` - a function called when an event is emitted. It takes an emitted event.
	* `publish` - a function that takes an event and publishes it.

### Example
```js
import createEventStore from 'resolve-es'
import createInFileStorageAdapter from 'resolve-storage-lite'
import createInMemoryBusAdapter from 'resolve-bus-memory'

const eventStore = createEventStore({
  storage: createInFileStorageAdapter({ pathToFile: './event-store.db' }),
  bus: createInMemoryBusAdapter()
});

eventStore.subscribeByEventType(['UserCreated'], event =>
  console.log('Loaded or fresh event is emitted, filtered by event type', event)
)

eventStore.subscribeByAggregateId(['1', '2'], event =>
  console.log('Loaded or fresh event is emitted, filtered by aggregate id', event)
)

eventStore.getEventsByAggregateId('1', event =>
  console.log('Aggregate event loaded', event)
, { startTime: new Date(2017,10,30).getTime() })

eventStore.subscribeByEventType(['UserCreated'], event =>
  console.log('Fresh event emitted from bus by event type', event),
{ onlyBus: true })

eventStore.subscribeByAggregateId(['1', '2'], event =>
  console.log('Fresh event emitted from bus by aggregate id', event),
{ onlyBus: true })

const event = {
  aggregateId: '1',
	aggregateVersion: 2,
  type: 'UserCreated',
  payload: {
    email: 'test@user.com'
  }
};

eventStore.saveEvent(event)
```
