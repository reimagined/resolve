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

## resolve.client.config

This file contains information for client side of your application.

### * rootCopmonent
_ReactElement_

Contains root component that will be rendered on client side.

### createStore
_function(initialState: Object): store

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in [resolve.server.config.js](#initialstate)


## resolve.server.config

This file contains information for SSR and resolve library.

### aggregates
_Array_

Array of aggregates for [resolve-command](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-command).


### bus
_Object_

Contains config for [resolve-bus](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-bus).

### entries

#### createStore
_function(initialState: Object): store

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

Contains config for [resolve-storage](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-storage).

## resolve.build.config

### extendWebpack
_function(clientConfig, sererConfig)_

It's a function where is possible to extend standart resolve client and server configs.
