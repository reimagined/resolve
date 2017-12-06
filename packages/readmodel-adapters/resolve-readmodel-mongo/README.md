
# **resolve-readmodel-mongo** [![npm version](https://badge.fury.io/js/resolve-readmodel-mongo.svg)](https://badge.fury.io/js/resolve-readmodel-mongo)

This package is a `resolve-query` adapter for storing a read model in [MongoDB database](https://www.mongodb.com/). Provided interface and functionality is equal to [memory adapter](../resolve-readmodel-memory), but store data in MongoDB instance.

Factory function for this adapter has following arguments:
* `url` - connection url for MongoDB, like described here: https://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html#connect.
* `options` - optional options.

Behaviour and API of current adapter is equalent to [memory adapter](../resolve-readmodel-memory).

## Usage

```js
import createMongoAdapter from 'resolve-readmodel-mongo';

const adapter = createMongoAdapter(
    'mongodb://instance-server-host:port/database'
);

```
