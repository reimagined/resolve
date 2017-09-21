# **resolve-storage-lite** [![npm version](https://badge.fury.io/js/resolve-storage-file.svg)](https://badge.fury.io/js/resolve-storage-file)

This package is a driver for `resolve-es` to store events using a file or a memory. This package doesn't have binary dependencies and not require additional applications (like MongoDB or SQL server).

## Available Parameters
You can pass the following argument when initializing a driver:
* `pathToFile` - path to a file where events will be stored. Notice, if that argument is not passed the driver will use memory to store events. In this way, when instance of application will be restarted all data will be lost.

## Usage

```js
import createDriver from 'resolve-storage-file';

const driver = createDriver({ pathToFile: './store.db' });
```
