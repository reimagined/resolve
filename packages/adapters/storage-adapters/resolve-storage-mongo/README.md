# **resolve-storage-mongo**
[![npm version](https://badge.fury.io/js/resolve-storage-mongo.svg)](https://badge.fury.io/js/resolve-storage-mongo)

This package is a `resolve-es` adapter for storing events using [MongoDB](https://docs.mongodb.com/).

## Available Parameters
* `url` - a MongoDB connection string. Refer to [Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/) for more information.
* `collectionName` - a name of a collection storing events.
## Usage

```js
import createAdapter from 'resolve-storage-mongo'

const adapter = createAdapter({
  url: 'mongodb://localhost:27017/CustomDatabaseName',
  collectionName: 'Events'
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-mongo-readme?pixel)
