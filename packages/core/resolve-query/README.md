# **resolve-query**
[![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides an interface for creating and querying Read- and View-Models.

A **Read Model** is an application state built from the Event Log by Projection Functions and used to reply to Queries. It can be saved into a server-side Storage using an appropriate [Read Model Adapter](../../adapters/readmodel-adapters). Queries to a Read Model are processed by Resolver Functions, which can filter, aggregate and/or paginate data before sending it to the client side. You can manage the Resolver behavior using client-defined arguments.  In this case, the server-side changes trigger the client-side updates.

A **View Model** is built on the client side and used to keep the UI up to the current application state. It is built and updated by Reducers. Aggregates whose events should participate in the View Model construction are defined by the `aggregateId` (in most cases, one aggregate corresponds to one view model, although, a wildcard `aggregateId` is possible).


```js
import createQuery from 'resolve-query'

const query = createQuery({
  readModelConnectors,
  snapshotAdapter,
  doUpdateRequest,
  readModels,
  viewModels,
  eventStore
})
```

#### Usage
* `eventStore` - A configured [eventStore](../resolve-es) instance.
* `snapshotAdapter` - An adapter for loading and saving the intermediate Aggregate state. The argument is optional, snapshots are not used by default.
* `readModelConnectors` - A Read Model [connector](../../adapters/readmodel-adapters) instances.

#### Read models

Pass the following arguments to the factory function to create a **Read Model**:
* `projection` - An object with **Projection Functions** used to handle incoming Events and build the Read Model.
* `resolvers` - An object with **Resolver Functions**. Each function should accept two arguments: the first argument is a reference to the target Read Model. The second argument is an object with fields used to extract data from a Read Model Storage.

A **Read Model** supports the following functions to query data:
* `read` - Performs a query within a Read Model via Resolvers. The first argument is a Resolver name; the second one contains an object with the Resolver function properties. Returns the Resolver execution result.
* `dispose` - Removes the Read Model. Invokes the Read Model Adapter's disposal mechanisms and stops listening to the Event Store bus. The default adapters' disposal operation disconnects with the storage and drops stored tables.

#### View models

Pass the following arguments to the factory function to create a **View Model**:
* `projection` - A map of [Redux-like Reducer functions](https://redux.js.org/docs/basics/Reducers.html). A function per each event type.

You can access Resolvers and query data from Read Models using a Facade, which supports the following functions:
* `read` - Performs a query from a View Model using Resolvers.
* `dispose` - Deletes the View Model (for internal use).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-query-readme?pixel)
