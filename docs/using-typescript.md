---
id: using-typescript
title: Using TypeScript
---

ReSolve supports TypeScript and provides type definitions tat cover most of the framework's functional blocks.
This article describes various aspects of using TypeScript when developing a reSolve application.

## Creating a TypeScript Application

A [templates and examples](introduction.md#examples-and-template-projects) shipped with reSolve come in a TypeScript flavor. When using the `create-resolve-app` tool, add the `-t` flag to the input to specify that a TypeScript application should be created:

```sh
yarn create resolve-app hello-world-react -e react -t
```

## Developing With reSolve Types
