# **resolve-query**
[![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides an interface for creating read and view models and query facade for them. 

Queries are used to observe a system's state. Read & View Models answer Queries and are built using Projection functions.

Read models can be build only on server, and current read model state can be persisted into some storage, which has apropriate adapter for it. Exctacting read model state is performed by resolver function, which can filter, aggregate and paginate state before sending it onto client browser. Resolver can support agrument, which is supposed by client browser, depend on which resolver can base it's behaviour. Read models can be reactive - in that case, client browser will recieve changes in result dataset, if such changes had been performed on server-side read model storage.

View Model can be build on server and client too. By definition view model can be entirely sent to client UI as part of Redux app state, and be updated by incoming events. View models can't have arguments, differs from aggregateId. Every view model is parametrized by one or several aggregateIds. 
View model also can have wildcard aggregateId, but it's very not recommended architecture - use reactive read models instead.

```
import { createReadModel, createViewModel, createFacade } from 'resolve-query'
```

## Usage
To create a **read model**, pass the following arguments to the `createReadModel` factory function:
* `eventStore` - a configured [eventStore](../resolve-es) instance.
* `projection` - functions which handles incoming events and perform mutations in read model storage. 
* `adapter` - a read model [adapter](../readmodel-adapters) instance. A memory [adapter](../readmodel-adapters/resolve-readmodel-memory) supporting the simple query & projection API is used by default.

To create a **view model**, pass the following arguments to the `createViewModel` factory function:
* `eventStore` - a configured [eventStore](../resolve-es) instance.
* `projection` - a map of [redux-like reducer functions](https://redux.js.org/docs/basics/Reducers.html) (one function for each event type).
* `snapshotAdapter` - optional, default no snapshots; adapter for loading and saving intermediate aggregate state.
* `snapshotBucketSize` - optional, default 100 events; event count between saving aggregate snapshot.


To create a query facade for a read/view model, pass the following arguments to the `createFacade` factory function:
* `model` - a read/view model resource a factory function created.
* `resolvers` - resolver functions for read/view model. First argument is reference to target view/read model. Second argument is object with fields which can be customly used in resolver logic for perform dataset extraction from read model storage.

A facade supports the following functions to send queries to a read/view model:
* `executeQuery` - main entry point to perform query within read/view model via resolvers; first argument is resolver name, second contains object with properties for resolver function; third argument provides auxiliary options for read storage entity - most likely it's aggregateIds list for view models;
* `makeReactiveReader` - reactive read models entry; first argument is callback for publishing diffs changes, second and following is equialent to `executeQuery`;
* `executeQueryRaw` - private function, invoke read/view model reader directly.
* `dispose` - private function, disposes read/view model.

### Example
See `examples/top-list` example
