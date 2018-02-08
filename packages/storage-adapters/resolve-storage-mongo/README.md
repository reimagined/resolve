# **resolve-storage-mongo**
[![npm version](https://badge.fury.io/js/resolve-storage-mongo.svg)](https://badge.fury.io/js/resolve-storage-mongo)

This package is a `resolve-es` adapter for storing events using [MongoDB](https://docs.mongodb.com/).

## Available Parameters
* `url` - a MongoDB connection string. Refer to [Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/) for more information.
* `collection` - a name of a collection storing events.
## Usage

```js
import createAdapter from 'resolve-storage-mongo';

const adapter = createAdapter({
    url: 'mongodb://localhost:27015',
    collection: 'events'
});
```
