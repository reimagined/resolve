# **🔍 resolve-query** [![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides a function to execute a query and get required information from a [read model](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models).

## Usage
When initializing a query, pass the following arguments:

* `eventStore` - configured [eventStore](../resolve-es) instance.
* `readModel` - [read model](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models) declaration.

The `readModel` object contains the following fields:

* `projection` - declaration for conversion event stream into read model storage. When the default adapter is used, a projection is a map of reducer functions, which describe default collection changes depending on incoming events. A projection can also be an array of reducer maps, where each map describes changes of its collection
* `gqlSchema` - read model data schema description in terms of the [GraphQL schema language](http://graphql.org/learn/schema/)
* `gqlResolvers` - map of [resolvers](http://dev.apollodata.com/tools/graphql-tools/resolvers.html) for replying to GraphQL query depending on defined `gqlSchema` and data in the read model storage
* `adapter` - one of the available read model [adapters](../readmodel-adapters) instance; a memory [adapter](../readmodel-adapters/resolve-readmodel-memory) with multiple collections support is used by default

After the query is initialized, you get a function that is used to get data from read models by [GraphQL](http://graphql.org/learn/) request. This function receives the following arguments:

* `qraphQLQuery` (required) - GraphQL query to get data.
* `graphQLVariables` - specify it, if `graphQLQuery` contains variables.
* `getJwt` - callback to retrieve actual client state stored in verified JWT token.
 
**Note**: Read model declaration can optionally omit the `gqlSchema` and `gqlResolvers` fields. In this case, a read model works in raw mode. Projection function is triggered on incoming events, but the query function is mapped on the raw *read* function, which is typically used in GraphQL resolvers. Raw mode can be helpful, if the selected read model storage provides its own API for retrieving data, like [Elasticsearch](https://www.elastic.co/) or [Searchify](https://www.searchify.com/).


### Example
Implement a read model for building News state with custom GraphQL resolvers and use the `resolve-query` library to get the first page of news. It handles events produced by an aggregate shown in the [resolve-command](../resolve-command#example) documentation.

```js
import createQueryExecutor from 'resolve-query'
import createEventStore from 'resolve-es'
import createStorageAdapter from 'resolve-storage-lite'
import createBusAdapter from 'resolve-bus-memory'

import newsReadModel from './news-read-model.js'

const eventStore = createEventStore({ 
    storage: createStorageAdapter(), 
    bus: createBusAdapter()
})

const readModels = newsReadModel

const query = createQueryExecutor({ eventStore, readModel })

// Request by GraphQL query with paramaters
query(
  'query ($page: ID!) { news(page: $page) { title, text, link } }',
  { page: 1 }
).then(state => {
  console.log(state)
})
```

##### news-read-model.js
```js
const NUMBER_OF_ITEMS_PER_PAGE = 10

export default {
  projection: {
    NewsCreated: (state, { aggregateId,  timestamp, payload: { title, link, text } }) => ([
      { id: aggregateId, title, text, link }
    ].concat(state)),

    NewsDeleted: (state, { aggregateId }) => state.filter(({ id }) => id !== aggregateId)
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
    news: async (read, { page }) => {
      const news = await read() // Retrieve default collection

      return (Number.isInteger(+page) && (+page > 0))
        ? news.slice(
          +page * NUMBER_OF_ITEMS_PER_PAGE - NUMBER_OF_ITEMS_PER_PAGE,
          +page * NUMBER_OF_ITEMS_PER_PAGE + 1
        )
        : news
    }
  }
}
```
