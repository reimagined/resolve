---
id: connector
title: Connector
description: This document describes the interface that a read model connector should expose.
---

The table below lists functions a custom Read Model's connector should implement.

| Function Name             | Description                                      |
| ------------------------- | ------------------------------------------------ |
| [connect](#connect)       | Initializes a connection to storage.             |
| [disconnect](#disconnect) | Closes the storage connection.                   |
| [drop](#drop)             | Removes the Read Model's data from storage.      |
| [dispose](#dispose)       | Dispose of this connector's unmanaged resources. |

### connect

Initializes a connection to storage. An implementation should return a store object.

#### Arguments

| Argument Name | Description                                       |
| ------------- | ------------------------------------------------- |
| readModelName | A read model for which to establish a connection. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#connect)
```js
const connect = async readModelName => {
  fs.writeFileSync(`${prefix}${readModelName}.lock`, true, { flag: 'wx' })
  readModels.add(readModelName)
  const store = {
    get() {
      return JSON.parse(String(fs.readFileSync(`${prefix}${readModelName}`)))
    },
    set(value) {
      fs.writeFileSync(`${prefix}${readModelName}`, JSON.stringify(value))
    }
  }
  return store
}
```

<!-- prettier-ignore-end -->

### disconnect

Closes the storage connection.

#### Arguments

| Argument Name | Description                   |
| ------------- | ----------------------------- |
| store         | A store object.               |
| readModelName | The read model to disconnect. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#disconnect)
```js
const disconnect = async (store, readModelName) => {
  safeUnlinkSync(`${prefix}${readModelName}.lock`)
  readModels.delete(readModelName)
}
```

<!-- prettier-ignore-end -->

### drop

Removes the Read Model's data from storage.

#### Arguments

| Argument Name | Description                        |
| ------------- | ---------------------------------- |
| store         | A store object.                    |
| readModelName | A Read Model whose data to remove. |

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#drop)
```js
const drop = async (store, readModelName) => {
  safeUnlinkSync(`${prefix}${readModelName}.lock`)
  safeUnlinkSync(`${prefix}${readModelName}`)
}
```

<!-- prettier-ignore-end -->

### dispose

Dispose of all unmanaged resources provided by this connector.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/custom-readmodel-sample/connector.js#dispose)
```js
const dispose = async () => {
  for (const readModelName of readModels) {
    safeUnlinkSync(`${prefix}${readModelName}.lock`)
  }
  readModels.clear()
}
```

<!-- prettier-ignore-end -->
