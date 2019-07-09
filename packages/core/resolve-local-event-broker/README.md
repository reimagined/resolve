# **resolve-local-event-broker**
[![npm version](https://badge.fury.io/js/resolve-local-event-broker.svg)](https://badge.fury.io/js/resolve-local-event-broker)

This package includes event broker for local run.

## Usage

When initializing an event broker, pass the following arguments:

* `eventStore` - the configured [eventStore](../resolve-es) instance.
* `bucketSize` - the bucket size.
* `databaseFile` - the path to a file where state of the bus are stored.
* `zmqBrokerAddress` - the ZMQ broker address.
* `zmqConsumerAddress` - the ZMQ consumer address.

## Example
```js
const localBusBroker = createBroker({
  eventStore,
  batchSize: 100,
  databaseFile: 'path/to/file',
  zmqBrokerAddress: "tcp://127.0.0.1:3500",
  zmqConsumerAddress: "tcp://127.0.0.1:3501"
})

localBusBroker.run()

```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-local-event-broker-readme?pixel)
