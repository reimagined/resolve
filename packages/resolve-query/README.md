# **🔍 resolve-query** [![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides an interface for creation [read and view models](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models) and query facade for them. 

Queries are used to observe a state of the system. Queries are answered by Read Models. Read Model is built by Projection functions. All events from the beginning of times are applied to Read Model to build its current state (or state at particular moment in time if necessary).
Some Read Models are sent to the client UI to be a part of Redux app state. They are small enough to fit into memory and can be kept up-to date right in the browser. We call them View Models.

```
import { createReadModel, createViewModel, createFacade } from 'resolve-query'
```


## Usage
To create **read model**, pass following arguments into `createReadModel` factory function:
* `eventStore` - configured [eventStore](../resolve-es) instance.
* `projection` - declaration for conversion event stream into read model storage. Projection form is dependent on used adapter; when the default adapter is used, a projection is a map of functions for each event type, which manipulates data in provided MongoDB-like store.
* `adapter` - one of the available read model [adapters](../readmodel-adapters) instance; a memory [adapter](../readmodel-adapters/resolve-readmodel-memory) with [MongoDB](https://docs.mongodb.com/manual/reference/method/js-collection/)-like query language is used by default

To create **view model**, pass following arguments into `createViewModel` factory function:
* `eventStore` - configured [eventStore](../resolve-es) instance.
* `projection` - map of [redux-like reducer functions](https://redux.js.org/docs/basics/Reducers.html) for each event type


To create query facade for read/view model, pass the following arguments into `createFacade` factory function:
* `model` - read/view model resource, created by one of above factory functions
* `gqlSchema` - read model data schema description in terms of the [GraphQL schema language](http://graphql.org/learn/schema/)
* `gqlResolvers` - map of [resolvers](http://dev.apollodata.com/tools/graphql-tools/resolvers.html) for replying to GraphQL query depending on defined `gqlSchema` and data in the read model storage
* `customResolvers` - optional resolvers for specific read/view models

Facade supports following functions to perform query on subsequent read/view model:
* `executeQueryGraphql` - get data from read/view models by [GraphQL](http://graphql.org/learn/) request
* `executeQueryCustom` - execute custom resolver function
* `dispose` - remove facade and release resources

Function `executeQueryGraphql` receives the following arguments:
* `qraphQLQuery` (required) - GraphQL query to get data.
* `graphQLVariables` - specify it, if `graphQLQuery` contains variables.
* `getJwt` - callback to retrieve actual client state stored in verified JWT token.
 
Function `executeQueryCustom` receives the following arguments:
* `name` (required) - custom resolver name to handle request
* `customParams` - custom parameters which passed into resolver function
* `getJwt` - callback to retrieve actual client state stored in verified JWT token.

Custom query can be helpful in following cases:
* if the selected read model storage provides its own API for retrieving data, like [Elasticsearch](https://www.elastic.co/) or [Searchify](https://www.searchify.com/)
* to pass actual view model state as client-side redux initial state
* to use internal features of selected adapter, which are not accessable via classical graphql query


### Example
Implement a read model for building News state with custom GraphQL resolvers and use the `resolve-query` library to get the first page of news. It handles events produced by an aggregate shown in the [resolve-command](../resolve-command#example) documentation.

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
