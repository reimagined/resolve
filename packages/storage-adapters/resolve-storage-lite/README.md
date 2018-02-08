# **resolve-storage-lite**
[![npm version](https://badge.fury.io/js/resolve-storage-lite.svg)](https://badge.fury.io/js/resolve-storage-lite)

This package is a `resolve-es` adapter for storing events using a file or memory. It does not have binary dependencies and does not require additional applications (like MongoDB or SQL server).

## Available Parameters
You can pass the following argument when initializing an adapter:
* `pathToFile` - the path to a file where events are stored. Notice, if that argument is not passed the adapter uses memory to store events. In this case, all data is lost when an application instance is restarted.

## Usage

```js
import createAdapter from 'resolve-storage-lite';

const adapter = createAdapter({ pathToFile: './store.db' });
```
