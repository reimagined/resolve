---
id: introduction
title: Introduction
---

## Setting Up

### Prerequisites

You need to have Node >=8 on you development machine and on the server.
You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to switch Node versions between different projects.

Make sure you have Node, NPM, and NPX installed:

```sh
$ node --version
v10.5.0
$ npx --version
6.1.0
```

### Getting Started

```sh
npx create-resolve-app my-awesome-app
cd my-awesome-app
npm run dev
```

Your app is running at http://localhost:3000

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

## Examples

The reSolved repository contains example projects. You can use them to study various use-case scenarios or as templates for new reSolve applications. The example projects are available in the repository's **[examples](https://github.com/reimagined/resolve/tree/master/examples)** folder.

The following example projects are available:

| Example Name                                                                                                | Description                                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world)                       | A blank app used as a default template for new reSolve applications                                             |
| [with-postcss](https://github.com/reimagined/resolve/tree/master/examples/with-postcss)                     | Demonstrates how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules)                  |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components) | Demonstrates how to work with [Styled Components](https://www.styled-components.com/docs)                       |
| [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list)                   | Demonstrates how to work with Read Models and View Models                                                       |
| [shopping-list-advanced](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-advanced) | Demonstrates how to use reSolve with [React Native](https://github.com/react-community/create-react-native-app) |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news)                       | A clone of the [HackerNews](https://news.ycombinator.com/) application implemented using reSolve                |

You can install any of these examples on your machine using the `create-resolve-app` tool with the `-e` flag followed by an example name.

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
