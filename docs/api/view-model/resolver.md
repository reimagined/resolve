---
id: resolver
title: Resolver
---

A view model resolver function has the following structure:

```js
async(api, query, context) => {
    ...
    return {
        data,
        meta
    }
}
```

## API

## Query

## Context

```js
{
  jwt, // Optional
  viewModel: {
    name,
    eventTypes
  }
}
```
