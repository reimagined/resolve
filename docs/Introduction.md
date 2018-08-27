# Setting Up

## Prerequisites

You need to have Node >=8 on you development machine and on the server.
You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to easily switch Node versions between different projects.

Make sure you have Node, NPM and NPX installed:

```sh
$ node --version
v10.5.0
$ npx --version
6.1.0
```

## Getting Started

```sh
npx create-resolve-app my-awesome-app
cd my-awesome-app
npm run dev
```

Your app is running at http://localhost:3000

# Core Concepts

## Domain Driven Design

Domain aggregate is a business model unit. Business logic is mostly in command handlers for the aggregate.

## Event Sourcing

Don't store system state, store events that brought system to this state.

## CQRS

System is divided in two "sides":

- Write Side accepts commands and generate events that stored in the Event Store.
- Read Side applies events to Read Models, and process queries.

Write side is optimized for writing, read side - for reading.
