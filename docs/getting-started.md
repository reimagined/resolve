---
id: getting-started
title: Getting Started
---

import Chart from './getting-started-chart/\_index.mdx'

<Chart />

## The reSolve Framework

ReSolve is a full stack JavaScript framework based on the Event Sourcing (ES) and Command and Query Responsibility Segregation (CQRS) paradigms. ReSolve comes with a wide variety of tools aimed to cover all needs of a real-world web application.

ReSolve is designed to implement idiomatically pure ES/CQRS on the server side and comes with several client-side libraries that take advantage of the server's architecture.

## CQRS in reSolve

:::tip Command and Query Responsibility Segregation
In CQRS an application is split into two sides:

- **Write Side** - receives commands and modifies the application's state based on the command data.
- **Read Side** - answers data queries based on the application's state.

:::

### Write Side

ReSolve implements the write side as a set of aggregates. An aggregate definition consists of the following parts:

- **Command Handlers** are functions associated with specific types of commands. A command handler implements logic used to analyze the command's data and produce an **event** object that describes a change in the application's state (see [ES in reSolve](#es-in-resolve)).
- **Projection** uses events produced by command handlers to build the aggregate state. This state can then be used by the command handlers, for example to implement input validation.

### Read Side

The read side is implemented as a set of read models. A read model definition consists of the following parts:

- **Projection** receives events and uses their data to modify the read model's persistent store.
- **Resolvers** answer data requests. Resolvers take data from the persistent store and uses it to build the queried data sample.

:::tip View Models
ReSolve also implements a reactive extension of the read model concept called a **view model**. A view model rebuilds its state on the fly and uses WebSockets to reactively synchronize the state with the client.
:::

## ES in reSolve

:::tip Event Sourcing
In Event Sourcing, an application stores its data as a chain of immutable **events**. From these events, the application builds its current **state** used to answer data requests. The application can rebuild its state from start of the history at any point in time.
:::

The reSolve application stores its data in a centralized event store, which can be configured to use different underlying data storages through the mechanism of adapters.

## Create and Explore a reSolve Application

## What's Next
