# **@resolve-js/eventstore-lite**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Feventstore-lite.svg)](https://badge.fury.io/js/%40resolve-js%2Feventstore-lite)

This package is a event store adapter used to store events in a file or memory.

## Available Parameters

You can pass the following argument when initializing an adapter:

- `databaseFile` - the path to a file where events are stored. If set to ":memory:", all data is lost when an application instance is restarted.

## Usage

```js
import createAdapter from '@resolve-js/eventstore-lite'

const fileAdapter = createAdapter({
  databaseFile: './store.db',
})

const memoryAdapter = createAdapter({
  databaseFile: ':memory:',
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-eventstore-lite-readme?pixel)
