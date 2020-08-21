# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.25.0

### Breaking Changes

#### resolve-client

- **timestamp** from query response now located in meta object

#### resolve-react-hooks

- **useViewModel** hook state callback initially invoked with view model's *Init* handler state value with second argument **initial=true**. Other state changes will come with **initial=false**

#### resolve-redux

- action types moved to internal namespace, avoid using them
- internal actions structure drastically changed, avoid using them, they can change in future
- custom redux sagas context changed:
  - **api** removed, **client** instance added (resolve-client package)
  
#### resolve-runtime

- **executeQuery** in API handlers now returns **data** object containing view or read model data and **meta** containing query meta data

#### resolve-scripts

- **subscribeAdapter** option is removed from config

#### Removed packages

- resolve-subscribe-mqtt
- resolve-subscribe-socket.io

### Added

- [Incremental import module](packages/modules/resolve-module-incremental-import/) (packages/modules/resolve-module-incremental-import/) provides out-of-the-box api-handlers that allow you to implement incremental import in any application..
- [Eventstore incremental import API](packages/adapters/eventstore-adapters/) (packages/adapters/eventstore-adapters/) 
  - `beginIncrementalImport` - begin accumulate events for incremental import
  - `pushIncrementalImport` - accumulate events for incremental import 
  - `commitIncrementalImport` - commit accumulated events to eventstore 
  - `rollbackIncrementalImport` - drop accumulated events
- resolve-client
  - **meta** object in query response containing meta data
- resolve-redux
  - new redux hook API
- resolve-query
  - [view model resolver](docs/read-side.md#view-model-resolver)

### Changed

- resolve-client
  - **url** and **cursor** params in the **subscribe** function

### Removed

