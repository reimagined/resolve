---
id: command-handler
title: Command Handler
description:
---

### context

the `context` argument is an object with the following fields:

| Field Name       | Description                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| jwt              | The JSON Web Token attached to the request.                                |
| aggregateVersion | The aggregate version identifier.                                          |
| encrypt          | The user-defined [encrypt](../advanced-techniques.md#encryption) function. |
| decrypt          | The user-defined [decrypt](../advanced-techniques.md#encryption) function. |
