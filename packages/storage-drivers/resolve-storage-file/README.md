# **resolve-storage-file** [![npm version](https://badge.fury.io/js/resolve-storage-file.svg)](https://badge.fury.io/js/resolve-storage-file)

This package is a driver for `resolve-es` to store events using a file. It is useful for development only  as it is not optimized for production.

## Available Parameters
You can pass the following argument when initializing a driver:
* `pathToFile` - path to a file where events will be stored.

## Usage

```js
import createDriver from 'resolve-storage-file';

const driver = createDriver({ pathToFile: './store.json' });
```
