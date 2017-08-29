# **resolve-storage-mongo** [![npm version](https://badge.fury.io/js/resolve-storage-mongo.svg)](https://badge.fury.io/js/resolve-storage-mongo)

This package serves as a driver for `resolve-es` to store events using MongoDB.

## Usage

```js
import createDriver from 'resolve-storage-mongo';

const driver = createDriver({
    url: 'mongo_url',
    collection: 'events'
});
```
