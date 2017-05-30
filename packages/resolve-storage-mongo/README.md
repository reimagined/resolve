# `resolve-storage-mongo`

This package serves as a driver for `resolve-storage` to store events using MongoDB.

## Usage

```js
import createDriver from 'resolve-storage-mongo';

const driver = createDriver({
    url: 'mongo_url',
    collection: 'events'
});
```
