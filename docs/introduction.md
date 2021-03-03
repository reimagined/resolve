---
id: introduction
title: Introduction
---

## Setting Up

### Prerequisites

You need to have Node >=10 on you development machine and on the server.
You can use [nvm](https://github.com/creationix/nvm#installation) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows#node-version-manager-nvm-for-windows) to switch Node versions between different projects.

Make sure you have Node, NPM, and NPX installed:

```sh
$ node --version
v10.5.0
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

The reSolve repository contains example projects. You can use them to study various use-case scenarios or as templates for new reSolve applications. The example projects are available in the repository's **[examples](https://github.com/reimagined/resolve/tree/master/examples)** folder.

The following example projects are available:

| Example Name                                                                                                                | Description                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world)                                       | A blank app used as a default template for new reSolve applications.                                                |
| [hello-world-typescript](https://github.com/reimagined/resolve/tree/master/examples/hello-world-typescript)                 | A blank app used as a default template for new reSolve applications with TypeScript support.                        |
| [with-postcss](https://github.com/reimagined/resolve/tree/master/examples/with-postcss)                                     | Demonstrates how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules).                     |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components)                 | Demonstrates how to work with [Styled Components](https://www.styled-components.com/docs).                          |
| [with-angular](https://github.com/reimagined/resolve/tree/master/examples/with-angular)                                     | Demonstrates how to use Angular to implement the client application.                                                |
| [with-vue](https://github.com/reimagined/resolve/tree/master/examples/with-vue)                                             | Demonstrates how to use Vue.js to implement the client application.                                                 |
| [with-vanillajs](https://github.com/reimagined/resolve/tree/master/examples/with-vanillajs)                                 | Demonstrates how to use the **@resolve-js/client** library to implement the client application in plain JavaScript. |
| [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list)                                   | Demonstrates how to work with Read Models and View Models.                                                          |
| [shopping-list-with-hooks](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-with-hooks)             | Demonstrates how to use the **@resolve-js/react-hooks** client library tp communicate with the backend.             |
| [shopping-list-with-redux-hooks](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-with-redux-hooks) | Demonstrates how to use the **@resolve-js/redux** library's hooks to communicate with the backend.                  |
| [shopping-list-advanced](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-advanced)                 | Demonstrates how to use reSolve with [React Native](https://github.com/react-community/create-react-native-app)     |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news)                                       | A clone of the [HackerNews](https://news.ycombinator.com/) application implemented using reSolve.                   |
| [cli-uploader](https://github.com/reimagined/resolve/tree/master/examples/cli-uploader)                                     | Demonstrates how to design a file uploader utility and handle file uploads on the server.                           |
| [image-gallery](https://github.com/reimagined/resolve/tree/master/examples/image-gallery)                                   | Demonstrates how to implement an image gallery and handle image uploads on the server.                              |
| [personal-data](https://github.com/reimagined/resolve/tree/master/examples/personal-data)                                   | Demonstrates how to store encrypted personal data.                                                                  |

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
