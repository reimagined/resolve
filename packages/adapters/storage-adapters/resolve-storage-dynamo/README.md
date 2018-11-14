# **resolve-storage-dynamo**
[![npm version](https://badge.fury.io/js/resolve-storage-dynamo.svg)](https://badge.fury.io/js/resolve-storage-dynamo)

This package is a `resolve-es` adapter for storing events using [DynamoDB](https://aws.amazon.com/dynamodb/).

## Available Parameters
* `...connectionOptions` - a DynamoDB connection options. Refer to [Connection Options Format](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html) for more information.
* `tableName` - a name of a table storing events.
* `readCapacityUnits` - the maximum number of strongly consistent reads consumed per second.
* `writeCapacityUnits` - the maximum number of writes consumed per second.
## Usage

```js
import createAdapter from 'resolve-storage-dynamo'

const connectionOptions = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'xxx',
  secretAccessKey: 'xxx',
}

const adapter = createAdapter({
  ...connectionOptions,
  tableName: 'MY_TABLE_NAME',
  readCapacityUnits: 5,
  writeCapacityUnits: 5
})
```

#### As Resource
```js
import { create, dispose, destroy } from 'resolve-storage-dynamo'

await create({ 
  region,
  tableName, 
  readCapacityUnits, 
  writeCapacityUnits 
})

await dispose({ 
  region,
  tableName, 
  newTableName, 
  readCapacityUnits, 
  writeCapacityUnits 
})

await destroy({ 
  region,
  tableName, 
  readCapacityUnits, 
  writeCapacityUnits 
})
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-mongo-readme?pixel)
