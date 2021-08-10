---
id: index
title: reSolve Documentation
description: Full stack CQRS, DDD, Event Sourcing framework for Node.js
---

[Introduction](introduction.md)

- [Setting Up](introduction.md#setting-up)
- [Prerequisites](introduction.md#prerequisites)
- [Getting Started](introduction.md#getting-started)
- [Examples](introduction.md#examples)

[Step-by-Step Tutorial](tutorial.md)

#### Basics

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
  - [View Model Resolver](read-side.md#view-model-resolver)
  - [Performing Queries Using HTTP API](read-side.md#performing-queries-using-http-api)
- [Sagas](sagas.md)
  - [Sagas Overview](sagas.md#sagas-overview)
  - [Define a Saga](sagas.md#define-a-saga)
  - [Register a Saga](sagas.md#register-a-saga)
- [API Handlers](api-handlers.md)
  - [API Reference](api-handlers.md#api-reference)
  - [Implementation Examples](api-handlers.md#implementation-examples)
- [Manage a ReSolve Application](manage-application.md)
  - [Installation](manage-application.md#installation)
  - [Usage](manage-application.md#usage)
- [reSolve app structure](resolve-app-structure.md)
  - [Configuration](resolve-app-structure.md#configuration)
  - [Write and Read Sides](resolve-app-structure.md#write-and-read-sides)
  - [Folder Structure](resolve-app-structure.md#folder-structure)

#### Guides

- [Advanced Techniques](advanced-techniques.md)

  - [Splitting Code Into Chunks](advanced-techniques.md#splitting-code-into-chunks)
  - [Adapters](advanced-techniques.md#adapters)
  - [Custom Read Models](advanced-techniques.md#custom-read-models)
  - [Modules](advanced-techniques.md#modules)
  - [Encryption](advanced-techniques.md#encryption)

- [Authentication and Authorization](authentication-and-authorization.md)

  - [Setting up Authentication](authentication-and-authorization.md#setting-up-authentication)
  - [Using 3rd-Party Auth Services](authentication-and-authorization.md#using-3rd-party-auth-services)
  - [Making Your Own User Registry](authentication-and-authorization.md#making-your-own-user-registry)
  - [Using JWT for Command and Query Authorization](authentication-and-authorization.md#using-jwt-for-command-and-query-authorization)

- [Preparing to Production](preparing-to-production.md)

  - [Configuration Options](preparing-to-production.md#configuration-options)
  - [Configuring Adapters](preparing-to-production.md#configuring-adapters)
  - [Using Environment Variables](preparing-to-production.md#using-environment-variables)

- [Debugging](debugging.md)

  - [Debug ReSolve](debugging.md#debug-resolve)
  - [Debug a ReSolve Application](debugging.md#debug-a-resolve-application)

- [Testing](testing.md)

  - [Testing Tools](testing.md#testing-tools)
  - [Testing Aggregates](testing.md#testing-aggregates)
  - [Testing Read Models](testing.md#testing-read-models)
  - [Testing Sagas](testing.md#testing-sagas)

- [Application Configuration](application-configuration.md)

[FAQ](faq.md)

[Troubleshooting](troubleshooting.md)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs/readme.md?pixel)
