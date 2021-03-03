# **@resolve-js/eventstore-base**

[![npm version](https://badge.fury.io/js/@resolve-js/eventstore-base.svg)](https://badge.fury.io/js/@resolve-js/eventstore-base)

This base package is a eventstore adapter for storing events.

## Usage

```js
import createAdapter from '@resolve-js/eventstore-xxx'

const adapter = createAdapter({
  /* options */
})

await adapter.init()

await loadEvents({
  eventTypes: ['TYPE_1', 'TYPE_2'],
  aggregateIds: ['aggregate_1', 'aggregate_2'],
  startTime: 0,
  finishTime: Date.now(),
})

await saveEvent(event)

await dispose({ dropEvents: false })
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-eventstore-base-readme?pixel)
