# **resolve-storage-mongo** [![npm version](https://badge.fury.io/js/resolve-storage-mongo.svg)](https://badge.fury.io/js/resolve-storage-mongo)

This package is a driver for `resolve-es` to store events using [MongoDB](https://docs.mongodb.com/).

## Available Parameters
* `url` - connection string to MongoDB. For more information, refer to [Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/).
* `collection` - name of a collection storing events.
## Usage

```js
import createDriver from 'resolve-storage-mongo';

const driver = createDriver({
    url: 'mongodb://localhost:27015',
    collection: 'events'
});
```
