---
id: command
title: Command
---

## Command Object

A command is an object of the following structure:

<!-- prettier-ignore-start -->

```js
{
  type, // A string that contains the command type name.
  aggregateId, // A string that uniquely identifies an aggregate instance.
  aggregateName, // The name of an aggregate that the command targets.
  payload, // An object of arbitrary structure that contains data attached to the command. 
  jwt // A JSON Web Token attached to the web request used to send the command. (optional)
}
```

<!-- prettier-ignore-end -->

## Command Result Object

A command result object has the following structure:

<!-- prettier-ignore-start -->

```js
export type CommandResult = {
  type, // A string that contains the command type name.
  payload, // An object of arbitrary structure that contains data attached to the command. (optional)
  timestamp?, // A number type field that stores the point in time when the command was received. (optional)
  aggregateId, // A string that uniquely identifies an aggregate instance. (optional)
  aggregateVersion, // A number that is incremented for each subsequent event with the current aggregateId. (optional)
}
```

<!-- prettier-ignore-end -->
