# **resolve-query**
[![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides an interface for creating read and view models and query facade for them. 

Queries are used to observe a system's state. Read & View Models are built using Projection functions and can answer Queries.

Read models are produced and consumed only on the server. Present read model state is saved into temporary or persistent storage by using appropriate adapter. Obtaining read model state is performed by resolver function, which can filter, aggregate and paginate state before sending it onto client browser. The resolver can be parametrized by client-defined arguments, based on which it can manage its behavior. Read models can be reactive. Then client browser will receive diffs in result dataset if some changes had been performed on server-side read model storage.

View Model can be built on server and client too. By definition, view model can be entirely sent to client UI as part of Redux app state, and be updated by incoming events. View models can't have arguments, differs from aggregateId. Every view model is parametrized by one or several aggregateIds. 
View model also can have wildcard aggregateId, but this is highly discouraged architecture - use reactive read models instead.

```
import { createReadModel, createViewModel } from 'resolve-query'
```

## Usage
To create a **read model**, pass the following arguments to the `createReadModel` factory function:
* `eventStore` - A configured [eventStore](../resolve-es) instance.
* `projection` - Functions which handles incoming events and perform mutations in read model storage.
* `adapter` - A read model [adapter](../readmodel-adapters) instance. A memory [adapter](../readmodel-adapters/resolve-readmodel-memory) supporting the simple query & projection API is used by default.
* `resolvers` - Resolver functions for read model. First argument is reference to target read model. Second argument is object with fields which can be customly used in resolver logic for perform dataset extraction from read model storage.

A read model supports the following functions to send queries to a read model:
* `read` - Main entry point to perform query within read model via resolvers. First argument is resolver name, second contains object with properties for resolver function. Returns resolver execution result.
* `makeReactiveReader` - Entry point for creating reactive read models. First argument is callback for publishing diffs changes, second and following is equivalent  to `read` function. Returns object `{ result, forceStop }` where `result` is first resolver execution result and `forceStop` is function to stop publishing diffs.
* `getLastError` - Retrieve last error occurred while applying events by adapter-bound projection functions.
* `getReadInterface` - Retrieve underlying read-side storage API object after it have been initialized. May be used for direct read-only interactions with read-model storage.
* `dispose` - Dispose read model, invoke disposing in read model adapter and stop listening Event Store bus. Disposing operation implemented in default adapters assumes disconnect with storage and drop stored tables.


To create a **view model**, pass the following arguments to the `createViewModel` factory function:
* `eventStore` - A configured [eventStore](../resolve-es) instance.
* `projection` - A map of [redux-like reducer functions](https://redux.js.org/docs/basics/Reducers.html). One function for each event type is required.
* `snapshotAdapter` Adapter for loading and saving intermediate aggregate state. Argument is optional, by default snapshots are not used.
* `snapshotBucketSize` - Event count between saving aggregate snapshot. Argument is options, by default value is 100.

A view model facade supports the following functions to send queries to a read model:
* `read` - Main entry point to perform query within view model via resolvers. Second argument provides aggregateIds list.
* `dispose` - Dispose view model and stop listening Event Store bus.


### Example
See `examples/top-list` example

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-query-readme?pixel)
