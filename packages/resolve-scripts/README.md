# `resolve-scripts`

Create resolve application with minimal configuration.

There are three configuration files. All of them must be placed in the root directory of your application.

- [resolve.client.config](#resolveclientconfig)
    - [rootComponent](#-rootcomponent)
    - [createStore](#createstore)
- [resolve.server.config](#resolveserverconfig)
    - [aggregates](#aggregates)
    - [bus](#bus)
    - [events](#events)
    - [entries](#entries)
    - [extendExpress](#extendexpress)
    - [initialState](#initialstate)
    - [queries](#queries)
    - [storage](#storage)
- [resolve.build.config](#resolvebuildconfig)
    - [extendWebpack](#extendwebpack)

Additional settings are provided by environment variables.
- [ROOT_DIR](#root_dir)
- [ENV variables](#env-variables)

## resolve.client.config

This file contains information for client side of your application.

### * rootCopmonent
_ReactElement_

Contains root component that will be rendered on client side.

### createStore
_function(initialState: Object): store_

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in [resolve.server.config.js](#initialstate)


## resolve.server.config

This file contains information for SSR and resolve library.

### aggregates
_Array_

Array of aggregates for [resolve-command](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-command).


### bus
_Object_

Contains config for resolve-bus-drivers.

### entries

#### createStore
_function(initialState: Object): store_

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in [resolve.server.config.js](#initialstate)

#### rootComponent
_ReactElement_

Contains root component that will be rendered on server side.

### events
_Object_

List of events.

### extendExpress
_function(req, res, next)_

It's possible to define there custom routes and write express middleware.

### initialState
_function(query): Promise_

Function that takes a [query](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-query) and returns a Promise. It's possible to get initial state by query to read-model and then resolve it with Promise.

### queries
_Array_

Array of read models for [resolve-query](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-query).

### storage
_Object_

Contains config for resolve-storage-driver.

## resolve.build.config

### extendWebpack
_function(clientConfig, sererConfig)_

It's a function where is possible to extend standart resolve client and server configs.

## ROOT_DIR

To change root directory of an application set the environment variable ROOT_DIR to needed value. For example `export ROOT_DIR=/newurl`. After that application will be available by `http://localhost:3000/newurl`. ROOT_DIR variable will be available on client side by `process.env.ROOT_DIR`.

## ENV variables

It is possible to pass env variable to client side. For this define variable with `RESOLVE_` prefix. After that variable will be available on client and on server side by `process.env`.
