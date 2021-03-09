# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.27.0

### Breaking Changes

#### Scoped packages

- reSolve packages are now published under the **@resolve-js** scope. You need to update reSolve package names in the dependecies and imports by replacing **'resolve-'** with **'@resolve-js/'**. For example, change **resolve-client** to **@resolve-js/client**.

#### Removed packages

- resolve-command
- resolve-query
- resolve-saga

#### Testing tools

- When querying read model resolvers from testing tools, the resolver results are returned unwrapped, the **data** property was removed.

#### Local config

- Removed the **eventBroker** section

#### Cloud config

- Runtime env RESOLVE_ES_SECRET_ARN renamed to RESOLVE_USER_SECRET_ARN
- Runtime env RESOLVE_ES_CLUSTER_ARN renamed to RESOLVE_EVENT_STORE_CLUSTER_ARN
- Runtime env RESOLVE_ES_DATABASE renamed to RESOLVE_EVENT_STORE_DATABASE_NAME
- Runtime env RESOLVE_READMODEL_SECRET_ARN renamed to RESOLVE_USER_SECRET_ARN
- Runtime env RESOLVE_ES_SECRET_ARN renamed to RESOLVE_USER_SECRET_ARN
- Runtime env RESOLVE_ES_EVENTS_TABLE removed
- Runtime env RESOLVE_ES_SECRETS_TABLE removed

### Added

#### Local config

- Added the **name** option. By default, it shares its value with the "name" field from package.json.

### Changed

#### Folder structure

- Packages folder structure has been changed. The **core** folder contains packages related to framework's core functionality. The **runtime** folder contains runtime-specific adapters, brokers etc. The **tools** folder contains basic scripts and testing tools.

## 0.25.0

### Breaking Changes

#### resolve-client

- The **timestamp** query response field is now located in the meta object

#### resolve-react-hooks

- The **useViewModel** hook state callback is initially invoked with the state value of the view model's _Init_ handler and the second argument (`initial`) set to `true`. On further state changes, `initial` is set `false`.

#### resolve-redux

- All action types have been moved to internal namespace, avoid using them.
- The internal action structure has been drastically changed and further changes are to be expected. Avoid directly using this actions.
- Custom redux saga context has changed:
  - The **api** object has been removed and a **client** object (from the resolve-client package) has been added.
- React native support has been temporary suspended.

#### resolve-runtime

- **executeQuery** in API handlers now returns a **data** object containing view or read model data and a **meta** object containing query meta data

#### resolve-scripts

- **subscribeAdapter** option has been removed from config

#### Removed packages

- resolve-subscribe-mqtt
- resolve-subscribe-socket.io

### Added

- [Incremental import module](packages/modules/resolve-module-incremental-import/) (packages/modules/resolve-module-incremental-import/) provides out-of-the-box api-handlers that allow you to implement incremental import in any application..
- [Eventstore incremental import API](packages/runtime/adapters/eventstore-adapters/) (packages/adapters/eventstore-adapters/)
  - `beginIncrementalImport` - begin accumulate events for incremental import
  - `pushIncrementalImport` - accumulate events for incremental import
  - `commitIncrementalImport` - commit accumulated events to eventstore
  - `rollbackIncrementalImport` - drop accumulated events
- resolve-client
  - **meta** object in query response containing meta data
- resolve-redux
  - New redux hook API
  - Added **serializedState** parameter to createStore

### Changed

- resolve-client
  - **url** and **cursor** params in the **subscribe** function

### Removed
