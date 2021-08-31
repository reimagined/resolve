---
id: command
title: Command
---

A command is an object of the following structure:

<!-- prettier-ignore-start -->

```js
{
  type, // A string that contains the command type name.
  aggregateId, // A string that uniquely identifies an aggregate instance.
  aggregateName, // The name of an aggregate that the command targets.
  payload, // An object of arbitrary structure that contains data attached to the command. (optional)
  jwt // A JSON Web Token attached to the web request used to send the command. (optional)
}
```

<!-- prettier-ignore-end -->
