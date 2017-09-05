# **resolve-storage-memory** [![npm version](https://badge.fury.io/js/resolve-storage-memory.svg)](https://badge.fury.io/js/resolve-storage-memory)

This package is a driver for `resolve-es` to store events using memory. It is useful for development only as all events are lost after the app is stopped.

## Usage

```js
import createDriver from 'resolve-storage-memory';

const driver = createDriver();
```
