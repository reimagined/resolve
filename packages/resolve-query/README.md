# **resolve-query**
[![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides an interface for creating read and view models and query facade for them. 

Queries are used to observe a system's state. Read & View Models answer Queries and are built using Projection functions.

Read models can be build only on server, and current read model state can be persisted into some storage, which has appropriate adapter for it. Exctacting read model state is performed by resolver function, which can filter, aggregate and paginate state before sending it onto client browser. Resolver can support agrument, which is supposed by client browser, depend on which resolver can base it's behaviour. Read models can be reactive - in that case, client browser will recieve changes in result dataset, if such changes had been performed on server-side read model storage.

View Model can be build on server and client too. By definition view model can be entirely sent to client UI as part of Redux app state, and be updated by incoming events. View models can't have arguments, differs from aggregateId. Every view model is parametrized by one or several aggregateIds. 
View model also can have wildcard aggregateId, but it's very not recommended architecture - use reactive read models instead.

```
import { createReadModel, createViewModel, createFacade } from 'resolve-query'
```

## Usage
To create a **read model**, pass the following arguments to the `createReadModel` factory function:
* `eventStore` - a configured [eventStore](../resolve-es) instance;
* `projection` - functions which handles incoming events and perform mutations in read model storage; 
* `adapter` - a read model [adapter](../readmodel-adapters) instance. A memory [adapter](../readmodel-adapters/resolve-readmodel-memory) supporting the simple query & projection API is used by default;
* `resolvers` - resolver functions for read model. First argument is reference to target read model. Second argument is object with fields which can be customly used in resolver logic for perform dataset extraction from read model storage.

A read model supports the following functions to send queries to a read model:
* `read` - main entry point to perform query within read model via resolvers; first argument is resolver name, second contains object with properties for resolver function;
* `makeReactiveReader` - reactive read models entry; first argument is callback for publishing diffs changes, second and following is equialent to `read`;
* `getLastError` - retrieve last error occured while applying events by adapter-bound projection functions;
* `getReadInterface` - retrieve underlying read-side storage API object after it have been initialized; may be used for direct read-only interactions with read-model storage;
* `dispose` - private function, disposes read model.


To create a **view model**, pass the following arguments to the `createViewModel` factory function:
* `eventStore` - a configured [eventStore](../resolve-es) instance;
* `projection` - a map of [redux-like reducer functions](https://redux.js.org/docs/basics/Reducers.html) (one function for each event type);
* `snapshotAdapter` - optional, default no snapshots; adapter for loading and saving intermediate aggregate state;
* `snapshotBucketSize` - optional, default 100 events; event count between saving aggregate snapshot.

A view model facade supports the following functions to send queries to a read model:
* `read` - main entry point to perform query within view model via resolvers; second argument provides aggregateIds list;
* `dispose` - private function, disposes view model.


### Example
See `examples/top-list` example

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-query-readme?pixel)
