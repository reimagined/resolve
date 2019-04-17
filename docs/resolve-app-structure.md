---
id: app-structure
title: reSolve App Structure
---

## Configuration

A reSolve application's main entry point is the **run.js** file. Code in this file assembles the app configuration object from several config files.

Configuration settings are split across the following files by default:

- **config.app.js** - Contains general app configuration settings. In this file, you should register the application's aggregates, Read Models and View Models.
- **config.dev.js** - Contains configuration settings that target the development server.
- **config.prod.js** - Contains configuration settings that target the production server.
- **config.test_functional.js** - Contains configuration settings that target the test environment.

## Write and Read Sides

In accordance with the CQRS paradigm, a reSolve application is divided into the **[write](write-side.md)** and **[read](read-side.md)** sides.

- The **[write side](write-side.md)** is represented by a set of aggregates. The aggregates receive commands and emit events in response. The events are then saved to the event store.
- The **[read side](read-side.md)** is used to query the application's data. The read side is represented by a set of **Read Models**.

A **Read Model** gradually accumulates event data in a storage based on the logic defined by the **projection**. When the client queries the data, the data is pulled from the storage by the **resolver**, processed based on the provided arguments and sent to the client in the required form.

ReSolve provides one special kind of Read Models - **View Models**. Instead of mutating some store, a View Model is assembled on the fly. View Models are compatible with Redux, so their data can be reactively updated on the client.

## Folder Structure

A typical reSolve applications has the following general structure:

```
📁 resolve-app
    📁 client
    📁 common
        📁 aggregates
        📁 read-models
        📁 view-models
        📁 sagas
```

The root folder contains the [configuration](#configuration) files.

The **client** folder contains all client code and markup.

The **common** folder contains sources for the reSolve application. This folder typically contains the following subfolders:

- **aggregates** - Contains source files for aggregate projections and command handlers.
- **read-models** - Contains source files for read model projections and resolvers.
- **view-models** - Contains source files for view model projections.
- **sagas** - Contains source files for sagas.
- **api-handlers** - Contains source files for API handlers.

Note, that this is the default and recommended folder structure. You are free to rearrange files as you like, provided that you adjust the app configurations accordingly.
