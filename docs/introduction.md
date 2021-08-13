---
id: introduction
title: Introduction
description: Full stack CQRS, DDD, Event Sourcing framework for Node.js
slug: /
---

ReSolve is a CQRS, DDD, Event Sourcing framework for Node.js. ReSolve implements an elaborate server-side infrastructure with out-of-the box support for various types of data storages, event export and import, encryption, testing and debugging tools? and more.

On the frontend, you can use the reSolve HTTP API or one of the included client libraries based on your requirements and and client-side technology of choice.

## Core Concepts

### Domain Driven Design

Domain aggregate is a business model unit. Business logic is mostly in command handlers for the aggregate.

### Event Sourcing

Don't store system state, store events that brought system to this state.

### CQRS

System is divided in two "sides":

- Write Side accepts commands and generate events that stored in the Event Store.
- Read Side applies events to Read Models, and process queries.

Write side is optimized for writing, read side - for reading.

## Setting Up

### Prerequisites

You need to have Node >=12.18 on you development machine and on the server.
You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to switch Node versions between different projects.

Make sure you have Node, NPM, and NPX installed:

```sh
$ node --version
v12.18.0
$ npx --version
6.1.0
```

### Getting Started

Use the following console input to create and run a minimal reSolve application:

```sh
npx create-resolve-app my-awesome-app
cd my-awesome-app
npm run dev
```

Your app is running at http://localhost:3000

> The create-resolve-app tool creates an application based on the latest versions of reSolve packages. If you want to update an existing application to a newer version of reSolve, ensure that all `resolve-*` dependencies in the application's package.json file have the same version number to avoid version conflicts.

## Examples and Template Projects

The reSolve repository contains example and template projects. You can use them to study various use-case scenarios or to create new reSolve applications. The example projects are available in the repository's **[examples](https://github.com/reimagined/resolve/tree/master/examples)** folder. The template projects are available in the repository's **[templates](https://github.com/reimagined/resolve/tree/master/templates)** folder.

You can install any of these projects on your machine using the `create-resolve-app` tool with the `-e` flag followed by an example or template name.

##### npm

```sh
npm install -g create-resolve-app
create-resolve-app resolve-example -e <example name>
```

##### npx

```sh
npx create-resolve-app resolve-example -e <example name>
```

##### yarn

```sh
yarn create resolve-app resolve-example -e <example name>
```
