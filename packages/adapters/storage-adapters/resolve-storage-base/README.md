# **resolve-storage-base**
[![npm version](https://badge.fury.io/js/resolve-storage-base.svg)](https://badge.fury.io/js/resolve-storage-base)

This base package is a `resolve-es` adapter for storing events.

## Usage

```js
import createAdapter from 'resolve-storage-xxx';

const adapter = createAdapter({ skipInit: true /*, options */});

await adapter.init()

await loadEvents({ 
  eventTypes: ['TYPE_1', 'TYPE_2'],
  aggregateIds: ['aggregate_1', 'aggregate_2'],
  startTime: 0,
  finishTime: Date.now()
}, callback)

await saveEvent(event)

await dispose({ dropEvents: false })
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-base-readme?pixel)
