# **resolve-storage-file** [![npm version](https://badge.fury.io/js/resolve-storage-file.svg)](https://badge.fury.io/js/resolve-storage-file)

This package serves as a driver for `resolve-es` to store events using a file.

## Usage

```js
import createDriver from 'resolve-storage-file';

const driver = createDriver({ pathToFile: './store.json' });
```
