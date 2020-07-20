---
id: application-configuration
title: Application Configuration
---

A reSolve application has a number of configuration files that define configuration options for different run targets.

## Overview

See the [JSON schema](https://github.com/reimagined/resolve/blob/master/packages/core/resolve-scripts/configs/schema.resolve.config.json) to familiarize yourself with the configuration structure definition.

## Reference

#### aggregates

An array of the application's aggregates. An aggregate configuration object within this array contains the following fields:

| Field            | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| name             | The aggregate's name.                                               |
| commands         | A path to a file that defines aggregate commands.                   |
| projection       | A path to a file that defines aggregate projection.                 |
| serializeState   | A path to a file that defines a state serializer function.          |
| deserializeState | A path to a file that defines a state deserializer function.        |
| encryption       | A path to a file that defines data encryption and decryption logic. |

#### apiHandlers

Specifies an array of the application's API Handlers. A Saga configuration object within this array contains the following fields:

| Field   | Description                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| path    | The URL path for which the handler is invoked. The path is specified in the [route-trie](https://www.npmjs.com/package/route-trie) router's format. |
| handler | The path to the file that contains the handler's definition.                                                                                        |
| method  | The HTTP method to handle.                                                                                                                          |


#### eventstoreAdapter

Specifies an adapter used to connect to to the application's event store. An adapter configuration object contains the following fields:

| Field         | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| module        | The name of a module or the path to a file that defines an adapter. |
| options    | An object that defines the adapter's options as key-value pairs                 |


#### readModels

An array of the application's Read Models. A Read Model configuration object within this array contains the following fields:

| Field         | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| name          | The Read Model's name                                                |
| projection    | A path to a file that defines Read Model projection.                 |
| resolvers     | A path to a file that defines Read Model resolver.                   |
| connectorName | The name of a connector used to connect the Read Model to its store. |

#### readModelConnectors 

An array of the application's Read Model connectors. A connector configuration object within this array contains the following fields:

| Field         | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| module        | The name of a module or the path to a file that defines a connector. |
| options    | An object that defines the connector's options as key-value pairs                 |


#### viewModels

Specifies an array of the application's View Models. A View Model configuration object within this array contains the following fields:

| Field            | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| name             | The aggregate's name.                                               |
| projection       | A path to a file that defines View Model projection.                |
| serializeState   | A path to a file that defines a state serializer function.          |
| deserializeState | A path to a file that defines a state deserializer function.        |
| validator        | A path to a file that defines a validation function.                |
| encryption       | A path to a file that defines data encryption and decryption logic. |

#### sagas

Specifies an array of the application's Sagas. A Saga configuration object within this array contains the following fields:

| Field         | Description                                                                |
| ------------- | -------------------------------------------------------------------------- |
| source        | A path to a file that defines the Saga's handlers and side effects.        |
| handlers      | A path to a file that defines the Saga's handlers.                         |
| sideEffects   | A path to a file that defines the Saga's side effects.                     |
| connectorName | Defines a Read Model storage used to store the saga's persistent data.     |
| schedulerName | Specifies the scheduler that should be used to schedule command execution. |
| encryption    | A path to a file that defines data encryption and decryption logic.        |
