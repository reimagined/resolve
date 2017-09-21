# **🏣 resolve-es** [![npm version](https://badge.fury.io/js/resolve-es.svg)](https://badge.fury.io/js/resolve-es)

Provides an event store implementation with the capability to use different [storage](../storage-drivers) and [bus](../bus-drivers) drivers to store and emit events. 
## Usage
When initializing an event store, pass the following arguments:
* `storage`  
	Use one of  [drivers](../storage-drivers) which the reSolve framework provides...
	* [resolve-storage-file](../storage-drivers/resolve-storage-file)
	* [resolve-storage-memory](../storage-drivers/resolve-storage-memory)
	* [resolve-storage-mongo](../storage-drivers/resolve-storage-mongo)

	... or implement your custom storage driver. Storage driver is an object with the following fields:
	* `saveEvent` - a function which takes an event and returns Promise that will be resolved when the event is stored in the storage.
	* `loadEventsByTypes` - a function which takes two arguments: an array of event types  and  callback that will be called for handling each appropriate event. 
	* `loadEventsByAggregateIds` - a function which takes two arguments: an aggregate id/ array of aggregate ids and callback that will be called for handling each  appropriate event. 

* `bus`  
	Use one of [drivers](../bus-drivers) which the reSolve framework provides...
	* [resolve-bus-memory](../bus-drivers/resolve-bus-memory)
	* [resolve-bus-rabbitmq](../bus-drivers/resolve-bus-rabbitmq)
	* [resolve-bus-zmq](../bus-drivers/resolve-bus-zmq)

	... or implement a custom bus driver. Bus driver is object with the following fields:
	* `subscribe` - a function called when any event is emitted. It takes an emitted event.
	* `publish` - a function that takes an event and publishes it.

### Example
```js
import createEventStore from 'resolve-es'
import createInFileStorageDriver from 'resolve-storage-file'
import createInMemoryBusDriver from 'resolve-bus-memory'

const eventStore = createEventStore({
  storage: createInFileStorageDriver({ pathToFile: './event-store.json' }),
  bus: createInMemoryBusDriver()
});

eventStore.subscribeByEventType(['UserCreated'], event =>
  console.log('Loaded or fresh event is emitted, filtered by event type', event)
)

eventStore.subscribeByAggregateId(['1', '2'], event =>
  console.log('Loaded or fresh event is emitted, filtered by aggregate id', event)
)

eventStore.getEventsByAggregateId('1', event =>
  console.log('Aggregate event loaded', event)
)

eventStore.subscribeByEventType(['UserCreated'], event =>
  console.log('Fresh event emitted from bus by event type', event),
true)

eventStore.subscribeByAggregateId(['1', '2'], event =>
  console.log('Fresh event emitted from bus by aggregate id', event),
true)

const event = {
  aggregateId: '1',
  type: 'UserCreated',
  payload: {
    email: 'test@user.com'
  }
};

eventStore.saveEvent(event)
```
