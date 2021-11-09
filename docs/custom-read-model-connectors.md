---
id: custom-read-model-connectors
title: Custom Read Model Connectors
---

You can implement a custom Read Model connector to define how a Read Model's data is stored. A connector implements the following functions:

- **connect** - Initializes a connection to a storage.
- **disconnect** - Closes the storage connection.
- **drop** - Removes the Read Model's data from storage.
- **dispose** - Forcefully disposes all unmanaged resources used by Read Models served by this connector.

The code sample below demonstrates how to implement a connector that provides a file-based storage for Read Models.

##### common/read-models/custom-read-model-connector.js:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js)
```js
import fs from 'fs'

const safeUnlinkSync = (filename) => {
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename)
  }
}

const connector = (options) => {
  const prefix = String(options.prefix)
  const readModels = new Set()
  const connect = async (readModelName) => {
    fs.writeFileSync(`${prefix}${readModelName}.lock`, 'true', { flag: 'wx' })
    readModels.add(readModelName)
    const store = {
      get() {
        return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
      },
      set(value) {
        fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
      },
    }
    return store
  }
  const disconnect = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    readModels.delete(readModelName)
  }
  const drop = async (store, readModelName) => {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
    safeUnlinkSync(`${prefix}${readModelName}`)
  }
  const dispose = async () => {
    for (const readModelName of readModels) {
      safeUnlinkSync(`${prefix}${readModelName}.lock`)
    }
    readModels.clear()
  }
  return {
    connect,
    disconnect,
    drop,
    dispose,
  }
}
```

<!-- prettier-ignore-end -->

A connector is defined as a function that receives an `options` argument. This argument contains a custom set of options that you can specify in the connector's configuration.

Register the connector in the application's configuration file.

##### config.app.js:

```js
readModelConnectors: {
  customReadModelConnector: {
    module: 'common/read-models/custom-read-model-connector.js',
    options: {
      prefix: path.join(__dirname, 'data') + path.sep // Path to a folder that contains custom Read Model store files
    }
  }
}
```

Now you can assign the custom connector to a Read Model by name as shown below.

##### config.app.js:

```js
  readModels: [
    {
      name: 'CustomReadModel',
      projection: 'common/read-models/custom-read-model.projection.js',
      resolvers: 'common/read-models/custom-read-model.resolvers.js',
      connectorName: 'customReadModelConnector'
    }
    ...
  ]
```

The code sample below demonstrates how you can use the custom store's API in the Read Model's code.

##### common/read-models/custom-read-model.projection.js:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/projection.js)
```js
const projection = {
  Init: async (store) => {
    await store.set(0)
  },
  INCREMENT: async (store, event) => {
    await store.set((await store.get()) + event.payload.count)
  },
  DECREMENT: async (store, event) => {
    await store.set((await store.get()) - event.payload.count)
  },
}

export default projection
```

<!-- prettier-ignore-end -->

##### common/read-models/custom-read-model.resolvers.js:

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/resolvers.js)
```js
const resolvers = {
  read: async (store) => {
    return await store.get()
  },
}

export default resolvers
```

<!-- prettier-ignore-end -->
