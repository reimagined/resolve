---
id: aggregate
title: Aggregate
---

An aggregate event handler function has the following structure:

```js

```

export type AggregateEventHandler = (
state: AggregateState,
event: Event
) => AggregateState

An event handler implementation receives the following arguments:
