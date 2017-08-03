# `resolve-scripts`

Create resolve application with minimal configuration.

There are three configuration files. All of them must be placed in the root directory of your application.

- [resolve.client.config](#resolve.client.config)
    - [rootComponent](#*-rootComponent)
    - [createStore](#createStore)
- [resolve.server.config](#resolve.server.config)
    _ [aggregates](#aggregates)
    _ [bus](#bus)
    _ [events](#events)
    _ [entries](#entries)
    _ [extendExpress](#extendExpress)
    _ [initialState](#initialState)
    _ [queries](#queries)
    _ [storage](#storage)
- [resolve.build.config](#resolve.build.config)
    - [extendWebpack](#extendWebpack)

## resolve.client.config

This file contains information for client side of your application.

### * rootCopmonent
_ReactElement_

Contains root component that will be rendered on client side.

### createStore
_function(initialState: Object): store

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in resolve.server.config.js


## resolve.server.config

This file contains information for SSR and resolve library.

### aggregates
_Array_

Array of aggregates for resolve-command.


### bus
_Object_

Contains config for resolve-bus.

### entries

#### createStore
_function(initialState: Object): store

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in resolve.server.config.js

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

Function that takes a query and returns a Promise. It's possible to get initial state by query to read-model and then resolve it with Promise.

### queries
_Array_

Array of read models for resolve-query.

### storage
_Object_

Contains config for resolve-storage

## resolve.build.config

### extendWebpack
_function(clientConfig, sererConfig)_

It's a function where is possible to extend standart resolve client and server configs.
