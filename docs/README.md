---
id: index
title: reSolve Documentation
---

- [Introduction](introduction.md)

  - [Setting Up](introduction.md#setting-up)
    - [Prerequisites](introduction.md#prerequisites)
    - [Getting Started](introduction.md#getting-started)
  - [Examples](introduction.md#examples)

- [Step-by-Step Tutorial](tutorial.md)

#### Basics

- [reSolve app structure](resolve-app-structure.md)
  - [Configuration](resolve-app-structure.md#configuration)
  - [Write and Read Sides](resolve-app-structure.md#write-and-read-sides)
  - [Folder Structure](resolve-app-structure.md#folder-structure)
- [Write Side](write-side.md)
  - [Aggregates](write-side.md#aggregates)
  - [Aggregate ID](write-side.md#aggregate-id)
  - [Configuring Aggregates](write-side.md#configuring-aggregates)
  - [Sending a Command](write-side.md#sending-a-command)
  - [Aggregate Command Handlers](write-side.md#aggregate-command-handlers)
  - [Aggregate Projection Function](write-side.md#aggregate-projection-function)
  - [Event Store](write-side.md#event-store)
- [Read Side](read-side.md)
  - [Read Models](read-side.md#read-models)
  - [Configuring Read Models and View Models](read-side.md#configuring-read-models-and-view-models)
  - [Initialize a Read Model](read-side.md#initialize-a-read-model)
  - [Updating a Read Model via Projection Functions](read-side.md#updating-a-read-model-via-projection-functions)
  - [Resolvers](read-side.md#resolvers)
  - [View Model Specifics](read-side.md#view-model-specifics)
  - [Performing Queries Using HTTP API](read-side.md#performing-queries-using-http-api)
- [Frontend](frontend.md)
  - [React/Redux Support](frontend.md#react-redux-support)
  - [Sending Commands as Redux Actions](frontend.md#sending-commands-as-redux-actions)
  - [Reactive View Models, Event Subscription](frontend.md#reactive-view-vodels-event-subscription)
  - [Optimistic Commands](frontend.md#optimistic-commands)
- [Standard HTTP API](curl.md)

#### Guides

- [Advanced Techniques](advanced-techniques.md)

  - [Splitting Code Into Chunks](advanced-techniques.md#splitting-code-into-chunks)
  - [Server-Side Rendering](advanced-techniques.md#server-side-rendering)
  - [Adapters](advanced-techniques.md#adapters)
  - [Modules](advanced-techniques.md#modules)

- [API Handlers](api-handlers.md)

  - [API Reference](api-handlers.md#api-reference)
  - [Implementation Examples](api-handlers.md#implementation-examples)

- [Sagas](sagas.md)

  - [Sagas Overview](sagas.md#sagas-overview)
  - [Define a Saga](sagas.md#define-a-saga)
  - [Register a Saga](sagas.md#register-a-saga)

- [Authentication and Authorization](authentication-and-authorization.md)

  - [Setting up Authentication](authentication-and-authorization.md#setting-up-authentication)
  - [Using 3rd-Party Auth Services](authentication-and-authorization.md#using-3rd-party-auth-services)
  - [Making Your Own User Registry](authentication-and-authorization.md#making-your-own-user-registry)
  - [Using JWT for Command and Query Authorization](authentication-and-authorization.md#using-jwt-for-command-and-query-authorization)

- [Preparing to Production](preparing-to-production.md)

  - [Configuration Options](preparing-to-production.md#configuration-options)
  - [Configuring Adapters](preparing-to-production.md#configuring-adapters)
  - [Using Environment Variables](preparing-to-production.md#using-environment-variables)

- [FAQ](faq.md)
- [API Reference](api-reference.md)
- [Troubleshooting](troubleshooting.md)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs/readme.md?pixel)
