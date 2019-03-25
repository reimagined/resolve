# **resolve-readmodel-mongo**
[![npm version](https://badge.fury.io/js/resolve-readmodel-mongo.svg)](https://badge.fury.io/js/resolve-readmodel-mongo)
 
A **Read Model Adapter** for [MongoDB](https://www.mongodb.com/) 4.0+.
The adapter provides a query API for projection and resolvers. This API is similar to the other reSolve adapters API, which means you can change a **Read Model Adapter** in the configuration file without changing the code.
 
## Available Parameters
* `url` - a MongoDB connection string. Refer to [Connection String URI Format](https://docs.mongodb.com/manual/reference/connection-string/) for more information.
* `...connectionSettings` - see [URI Connection Settings](https://github.com/mongodb/node-mongodb-native/blob/master/docs/reference/content/reference/connecting/connection-settings.md) for more information.

Adapter interface is provided by **resolve-readmodel-base** package.

## Usage

```js
import createAdapter from 'resolve-readmodel-mongo'

const adapter = createAdapter({
  url: 'mongodb://localhost:27017/DatabaseName',
  ...connectionSettings
})
```
 
![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-readmodel-mongo-readme?pixel)
