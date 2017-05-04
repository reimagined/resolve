# `resolve-es-file`

This package serves as a driver for event store using file to store events.

## Usage

```js
import createDriver from 'resolve-es-file';

const driver = createDriver({ pathToFile: './store.json' });
```
