---
id: getting-started
title: Getting Started
---

## The reSolve Framework

ReSolve is a full stack JavaScript framework based on the Event Sourcing (ES) and Command and Query Responsibility Segregation (CQRS) paradigms. ReSolve comes with a wide variety of tools aimed to cover all needs of a real-world web application.

ReSolve is designed to implement idiomatically pure ES/CQRS on the server side and comes with several client-side libraries that take advantage of the server's architecture.

## ES in reSolve

:::tip Event Sourcing
In Event Sourcing, an application stores its data as a chain of immutable **events**. From these events, the application builds its current **state** used to answer data requests. The application can rebuild its state from start of the history at any point in time.
:::

The reSolve application stores its data in a centralized event store, which can be configured to use different underlying data storages through the mechanism of adapters.

## CQRS in reSolve

## Create and Explore a reSolve Application

## What's Next
