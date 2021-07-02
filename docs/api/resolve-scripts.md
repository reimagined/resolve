---
id: resolve-scripts
title: reSolve Scripts
---

The [@resolve-js/scripts](https://github.com/reimagined/resolve/tree/master/packages/tools/scripts) package contains service scripts used to configure, build, and run reSolve applications. The package contains the following scripts:

| Script                                | Description                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| [build](#build)                       | Builds an application.                                                        |
| [start](#start)                       | Runs an application.                                                          |
| [watch](#watch)                       | Runs an application in **watch** mode. (Watch application files for changes.) |
| [runTestcafe](#runtestcafe)           | Runs TestCafe tests.                                                          |
| [merge](#merge)                       | Merges modules and application configurations into a single object.           |
| [stop](#stop)                         | Stops an application.                                                         |
| [reset](#reset)                       | Resets an application's persistent storages and snapshots.                    |
| [importEventStore](#importeventstore) | Imports events from a file to an application's event store.                   |
| [exportEventStore](#exporteventstore) | Exports events from an application's event store to a file.                   |
| [validateConfig](#validateconfig)     | Validates a configuration object.                                             |

The @resolve-js/scripts library also exports a `defaultResolveConfig` object that contains default configuration settings. This object is merged with an application's configuration objects to receive a global configuration object:

```js
// run.js
const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
```

### build

Builds an application.

#### Example

#### build

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#build)
```js
import {
  build,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
    ...
      case 'build': {
        const resolveConfig = merge(baseConfig, prodConfig)
        await build(resolveConfig)
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### start

Runs a built application.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#start)
```js
import {
  ...
  start,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'start': {
        await start(merge(baseConfig, prodConfig))
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### watch

Runs an application in **watch** mode. (Watch application files for changes.)

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#watch)
```js
import {
  ...
  watch,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'dev': {
        const resolveConfig = merge(baseConfig, devConfig)
        await watch(resolveConfig)
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### runTestcafe

Runs TestCafe tests.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#runTestcafe)
```js
import {
  ...
  runTestcafe,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'test:functional': {
        const resolveConfig = merge(baseConfig, testFunctionalConfig)
        await runTestcafe({
          resolveConfig,
          functionalTestsDir: 'test/functional',
          browser: process.argv[3]
        })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### merge

Merges modules and application configs into a single object.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#merge)
```js
import {
  ...
  merge,
  ...
} from '@resolve-js/scripts'
  ...
    const resolveConfig = merge(defaultResolveConfig, appConfig, devConfig)
```

<!-- prettier-ignore-end -->

### reset

Resets an application's persistent storages and snapshots.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#reset)
```js
import {
  ...
  reset,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'reset': {
        const resolveConfig = merge(baseConfig, devConfig)
        await reset(resolveConfig, {
          dropEventStore: true,
          dropEventSubscriber: true,
          dropReadModels: true,
          dropSagas: true
        })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### importEventStore

Imports events from a file to an application's event store.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#importEventStore)
```js
import {
  ...
  importEventStore,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'import-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const importFile = process.argv[3]
        await importEventStore(resolveConfig, { importFile })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### exportEventStore

Exports events from an application's event store to a file.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#exportEventStore)
```js
import {
  ...
  exportEventStore,
  ...
} from '@resolve-js/scripts'
    ...
    switch (launchMode) {
      ...
      case 'export-event-store': {
        const resolveConfig = merge(baseConfig, devConfig)

        const exportFile = process.argv[3]
        await exportEventStore(resolveConfig, { exportFile })
        break
      }
      ...
    }
```

<!-- prettier-ignore-end -->

### validateConfig

Validates a configuration object.

#### Example

<!-- prettier-ignore-start -->

[mdis]:# (../tests/resolve-scripts-sample/run.js#validateConfig)
```js
import {
  ...
  validateConfig,
  ...
} from '@resolve-js/scripts'
    ...
    validateConfig(config)
```

<!-- prettier-ignore-end -->
