---
id: index
title: Index
---

- [Introduction](introduction.md)

  - [Setting Up](introduction.md#setting-up)
    - [Prerequisites](introduction.md#prerequisites)
    - [Getting Started](introduction.md#getting-started)
  - [Examples](introduction.md#examples)
  - [Learning Resouces](introduction.md#learning-resouces)

- [Basics](basics/README.md)

  - [reSolve app structure](basics/resolve-app-structure.md)
    - [Configuration](basics/resolve-app-structure.md#configuration)
    - [Write and Read Sides](basics/resolve-app-structure.md#write-and-read-sides)
    - [Folder Structure](basics/resolve-app-structure.md#folder-structure)
  - [Write Side](basics/write-side.md)
    - [Aggregates](basics/write-side.md#aggregates)
    - [Aggregate ID](basics/write-side.md#aggregate-id)
    - [Configuring Aggregates](basics/write-side.md#configuring-aggregates)
    - [Sending a Command](basics/write-side.md#sending-a-command)
    - [Aggregate Command Handlers](basics/write-side.md#aggregate-command-handlers)
    - [Aggregate Projection Function](basics/write-side.md#aggregate-projection-function)
    - [Event Store](basics/write-side.md#event-store)
  - [Read Side](basics/read-side.md)
    - [Read Models](basics/read-side.md#read-models)
    - [Configuring Read Models and View Models](basics/read-side.md#configuring-read-models-and-view-models)
    - [Initialize a Read Model](basics/read-side.md#initialize-a-read-model)
    - [Updating a Read Model via Projection Functions](basics/read-side.md#updating-a-read-model-via-projection-functions)
    - [Resolvers](basics/read-side.md#resolvers)
    - [View Model Specifics](basics/read-side.md#view-model-specifics)
    - [Performing Queries Using HTTP API](basics/read-side.md#performing-queries-using-http-api)
  - [Frontend](basics/frontend.md)
    - [React/Redux Support](basics/frontend.md#react-redux-support)
    - [Sending Commands as Redux Actions](basics/frontend.md#sending-commands-as-redux-actions)
    - [Reactive View Models, Event Subscription](basics/frontend.md#reactive-view-vodels-event-subscription)
    - [Optimistic Commands](basics/frontend.md#optimistic-commands)

- [Authentication and Authorization](authentication-and-authorization.md)

  - [Setting up Authentication](authentication-and-authorization.md#setting-up-authentication)
  - [Using 3rd-Party Auth Services](authentication-and-authorization.md#using-3rd-party-auth-services)
  - [Making Your Own User Registry](authentication-and-authorization.md#making-your-own-user-registry)
  - [Using JWT for Command and Query Authorization](authentication-and-authorization.md#using-jwt-for-command-and-query-authorization)

- [Preparing to Production](preparing-to-production.md)

  - [Configuration Options](preparing-to-production.md#configuration-options)
  - [Configuring Adapters](preparing-to-production.md#configuring-adapters)
  - [Using Environment Variables](preparing-to-production.md#using-environment-variables)

- [Advanced Techniques](advanced-techniques.md)

  - [Splitting Code Into Chunks](advanced-techniques.md#splitting-code-into-chunks)
  - [Running Serverless](advanced-techniques.md#running-serverless)
  - [Server-Side Rendering](advanced-techniques.md#server-side-rendering)
  - [Process Managers (Sagas)](advanced-techniques.md#process-managers-sagas)
  - [Adapters](advanced-techniques.md#adapters)

- [FAQ](faq.md)
- [API Reference](api-reference.md)
- [Troubleshooting](troubleshooting.md)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/docs/readme.md?pixel)
