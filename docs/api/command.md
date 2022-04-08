---
id: command
title: Command
---

## Command Object

:::info TypeScript Support

A command object has an associated TypeScript type:

- Type Name - `Command`
- Package - `@resolve-js/core`

:::

A command is an object of the following structure:

<!-- prettier-ignore-start -->

```js
{
  type, // A string that contains the command type name.
  aggregateId, // A string that uniquely identifies an aggregate instance.
  aggregateName, // The name of an aggregate that the command targets.
  payload, // An object of arbitrary structure that contains data attached to the command. 
  jwt // Optional. A JSON Web Token attached to the web request used to send the command.
}
```

<!-- prettier-ignore-end -->

## Command Result Object

:::info TypeScript Support

A command result object has an associated TypeScript type:

- Type Name - `CommandResult`
- Package - `@resolve-js/core`

:::

A command result object has the following structure:

<!-- prettier-ignore-start -->

```js
export type CommandResult = {
  type, // A string that contains the command type name.
  payload, // Optional. An object of arbitrary structure that contains data attached to the command.
  timestamp?, // Optional. A number type field that stores the point in time when the command was received.
  aggregateId, // Optional. A string that uniquely identifies an aggregate instance.
  aggregateVersion, // Optional. A number that is incremented for each subsequent event with the current aggregateId.
}
```

<!-- prettier-ignore-end -->
