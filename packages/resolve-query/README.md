# **🔍 resolve-query** [![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides an interface for creating [read and view models](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models) and query facade for them. 

Queries are used to observe a system
's state. Read Models answer Queries and are built using Projection functions. All events from the beginning of time are applied to a Read Model to build its current state (or a state at a particular moment in time if necessary). Some Read Models, called View Models, are sent to the client UI to be a part of a Redux app state. They are small enough to fit into memory and can be kept up to date in the browser.

```
import { createReadModel, createViewModel, createFacade } from 'resolve-query'
```


## Usage
To create a **read model**, pass the following arguments to the `createReadModel` factory function:
* `eventStore` - a configured [eventStore](../resolve-es) instance.
* `projection` - functions converting an event stream into a read model storage. A projection form is dependent on the used adapter. When the default adapter is used, a projection is a map of functions (one function for each event type) which manipulate data in the provided MongoDB-like store.
* `adapter` - a read model [adapter](../readmodel-adapters) instance. A memory [adapter](../readmodel-adapters/resolve-readmodel-memory) supporting the [MongoDB](https://docs.mongodb.com/manual/reference/method/js-collection/)-like query language is used by default.

To create a **view model**, pass the following arguments to the `createViewModel` factory function:
* `eventStore` - a configured [eventStore](../resolve-es) instance.
* `projection` - a map of [redux-like reducer functions](https://redux.js.org/docs/basics/Reducers.html) (one function for each event type).


To create a query facade for a read/view model, pass the following arguments to the `createFacade` factory function:
* `model` - a read/view model resource a factory function created.
* `gqlSchema` - a read model data schema description in terms of the [GraphQL schema language](http://graphql.org/learn/schema/).
* `gqlResolvers` - a map of [resolvers](http://dev.apollodata.com/tools/graphql-tools/resolvers.html) for replying to a GraphQL query depending on the specified `gqlSchema` and read model storage data.
* `customResolvers` - optional resolvers for specific read/view models.

A facade supports the following functions to send queries to a read/view model:
* `executeQueryGraphql` - gets data from read/view models using a [GraphQL](http://graphql.org/learn/) request;
* `executeQueryCustom` - executes a custom resolver function;
* `dispose` - removes a facade and releases resources.

The `executeQueryGraphql` function receives the following arguments:
* `qraphQLQuery` (required) - the GraphQL query to get data;
* `graphQLVariables` - specify it if the `graphQLQuery` contains variables;
* `getJwtValue` - a callback to retrieve the actual client state stored in a verified JWT token.
 
The `executeQueryCustom` function receives the following arguments:
* `name` (required) - a custom resolver name to handle a request;
* `customParams` - custom parameters passed to a resolver function;
* `getJwtValue` - a callback to retrieve the actual client state stored in a verified JWT token.

A custom query can be helpful in the following cases:
* if the selected read model storage provides a
n API for retrieving data, like [Elasticsearch](https://www.elastic.co/) or [Searchify](https://www.searchify.com/);
* to pass the actual view model state as a client-side redux initial state;
* to use the selected adapter's  internal features which are not accessible via a regular graphql query.


### Example
Implement a read model for building a News state with custom GraphQL resolvers and use the `resolve-query` library to get the first news page. It handles events an aggregate produces ( see the  [resolve-command](../resolve-command#example) documentation).

```js
import { createReadModel, createFacade } from 'resolve-query'
import createMemoryAdapter from 'resolve-readmodel-memory'
import createEventStore from 'resolve-es'
import createStorageAdapter from 'resolve-storage-lite'
import createBusAdapter from 'resolve-bus-memory'

import newsReadModel from './news-read-model.js'

const eventStore = createEventStore({ 
    storage: createStorageAdapter(), 
    bus: createBusAdapter()
})

const executeQueryGraphql = createFacade({
  model: createReadModel({
    eventStore,
    projection: newsReadModel.projection,
    adapter: createMemoryAdapter()
  }),
  gqlSchema: newsReadModel.gqlSchema,
  gqlResolvers: newsReadModel.gqlResolvers
})

// Request by GraphQL query with paramaters
executeQueryGraphql(
  'query ($page: ID!) { news(page: $page) { title, text, link } }',
  { page: 1 }
).then((result) => {
  console.log(result)
})
```

##### news-read-model.js
```js
const NUMBER_OF_ITEMS_PER_PAGE = 10

export default {
  projection: {
    NewsCreated: async (store, { aggregateId,  timestamp, payload: { title, link, text } }) => {
      const news = await store.collection('News')
      await news.insert({ id: aggregateId, title, text, link })
    },

    NewsDeleted: (store, { aggregateId }) => {
      const news = await store.collection('News')
      await news.remove({ id: aggregateId })
    }
  },

  gqlSchema: `
    type News {
      id: ID!
      title: String!
      text: String
      link: String
    }
    type Query {
      news(page: Int, aggregateId: ID): [News]
    }
  `,

  gqlResolvers: {
    news: async (store, { page }) => {
      const news = await store.collection('News')

      if(Number.isInteger(+page) && (+page > 0)) {
        return await news.find({})
          .skip((page - 1) * NUMBER_OF_ITEMS_PER_PAGE)
          .limit(NUMBER_OF_ITEMS_PER_PAGE)
      }
        
      return await news.find({})
    }
  }
}
```
