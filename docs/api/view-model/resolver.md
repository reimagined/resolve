---
id: resolver
title: Resolver
---

A view model resolver function has the following structure:

```js

async(api, query, context) => {
    ...
    return {
        data, // Built view model data.
        meta  // Meta data about the resolver execution results (see below).
    }
}
```

The `meta` object returned by a resolver should have the following structure:

```js
{
  cursor, // The data cursor used to traverse the events included into the query result set.
  eventTypes, // The list of event types available to the client.
  aggregateIds, // List of aggregate IDs available to the client.
}
```

## API

The `API` argument provides is an object that contains the following API:

| Function Name  | Description                        |
| -------------- | ---------------------------------- |
| buildViewModel | Runs projection for the view model |

## Query

The `query` argument is an object of the following field:

| Field Name    | Description                                              |
| ------------- | -------------------------------------------------------- |
| aggregateIds  | An array of aggregate IDs.                               |
| aggregateArgs | An object that contains arguments attached to the query. |

## Context

The `context` argument is an object of the following structure:

```js
{
  jwt, // The JSON web token attached to the request (Optional).
  viewModel: {
    name, // The name of the view model.
    eventTypes // The event types available to the view model.
  }
}
```
