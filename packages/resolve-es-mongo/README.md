# `resolve-es-mongo`

This package serves as a driver for event store using MongoDB to store events.

## Usage

```js
import createDriver from 'resolve-es-mongo';

const driver = createDriver({
    url: 'mongo_url',
    collection: 'events'
});
```
