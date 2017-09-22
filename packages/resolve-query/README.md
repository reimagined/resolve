# **🔍 resolve-query** [![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides a function to execute a query and get required information from a [read model](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models).

## Usage
When initializing a query, pass the following arguments:

* `eventStore` - configured [eventStore](../resolve-es) instance.
* `readModel` - [read model](../resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models) declaration.
	
After the query is initialized, you get a function that is used to get data from read models by [GraphQL](http://graphql.org/learn/) request. This function receives the following arguments:
 * `qraphQLQuery` (required) - GraphQL query to get data.
 * `graphQLVariables` - specify it, if `graphQLQuery` contains variables.
 * `getJwt` - callback to retrieve actual client state stored in verified JWT token.
 
 ### Example
Let's implement the Read Model for building News state with custom GraphQL resolvers. It will handle the same events that are produced in [Aggregate example](../resolve-command#example).

Implement a read model for building News state with custom GraphQL resolvers and use the `resolve-query` library to get the first page of news. It handles events produced by an aggregate shown in the [resolve-command](../resolve-command#example) documentation.

```js
import createQueryExecutor from 'resolve-query'
import createEventStore from 'resolve-es'
import createStorageDriver from 'resolve-storage-memory'
import createBusDriver from 'resolve-bus-memory'

import newsReadModel from './news-read-model.js'

const eventStore = createEventStore({ 
    storage: createStorageDriver(), 
    bus: createBusDriver()
})

const readModels = newsReadModel

const query = createQueryExecutor({ eventStore, readModel })

// Request by GraphQL query with paramaters
query(
  'query ($page: ID!) { news(page: $page) { title, text } }',
  { page: 1 }
).then(state => {
  console.log(state)
})
```

##### news-read-model.js
```js
import Immutable from 'seamless-immutable'

const checkState = state => Immutable.isImmutable(state) ? state : Immutable([])

export default {
  name: 'news',
  projection: {
    NEWS_CREATED: (oldState, { 
        aggregateId, 
        timestamp,
        payload: { 
            title, link, userId, text 
        } 
    }) => {
      const state = checkState(oldState)
      const type = !link ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

      return Immutable(
        [
          {
            id: aggregateId,
            type,
            title,
            text,
            createdBy: userId,
            createdAt: timestamp,
            link,
            comments: [],
            commentsCount: 0,
            votes: []
          }
        ].concat(state)
      )
    },

    NEWS_UPVOTED: (oldState, { aggregateId, payload: { userId } }) => {
      const state = checkState(oldState)
      const index = state.findIndex(({ id }) => id === aggregateId)

      if (index < 0) {
        return state
      }

      return state.updateIn([index, 'votes'], votes => votes.concat(userId))
    },

    NEWS_UNVOTED: (oldState, { aggregateId, payload: { userId } }) => {
      const state = checkState(oldState)
      const index = state.findIndex(({ id }) => id === aggregateId)

      if (index < 0) {
        return state
      }

      return state.updateIn([index, 'votes'], votes =>
        votes.filter(id => id !== userId)
      )
    },

    NEWS_DELETED: (oldState, { aggregateId }) => {
      const state = checkState(oldState)
      return state.filter(({ id }) => id !== aggregateId)
    },

    COMMENT_CREATED: (oldState, { aggregateId, payload: { parentId, commentId } }) => {
      const state = checkState(oldState)
      const newsIndex = state.findIndex(({ id }) => id === aggregateId)

      if (newsIndex < 0) {
        return state
      }

      let newState = state.updateIn(
        [newsIndex, 'commentsCount'],
        count => count + 1
      )

      const parentIndex = state.findIndex(({ id }) => id === parentId)

      if (parentIndex < 0) {
        return newState
      }

      return newState.updateIn([parentIndex, 'comments'], comments =>
        comments.concat(commentId)
      )
    },

    COMMENT_REMOVED: (oldState, { aggregateId, payload: { parentId, commentId } }) => {
      const state = checkState(oldState)
      const newsIndex = state.findIndex(({ id }) => id === aggregateId)

      if (newsIndex < 0) {
        return state
      }

      let newState = state.updateIn(
        [newsIndex, 'commentsCount'],
        count => count - 1
      )

      const parentIndex = state.findIndex(({ id }) => id === parentId)

      if (parentIndex < 0) {
        return newState
      }

      return newState.updateIn([parentIndex, 'comments'], comments =>
        comments.filter(id => id !== commentId)
      )
    }
  },

  gqlSchema: `
    type News {
      id: ID!
      type: String!
      title: String!
      text: String
      createdBy: String!
      createdAt: String!
      link: String
      comments: [String]
      commentsCount: Int!
      votes: [String]
    }
    type Query {
      news(page: Int, aggregateId: ID, type: String): [News]
    }
  `,

  gqlResolvers: {
    news: async (read, { page, aggregateId, type }) => {
      const root = await read(aggregateId ? { aggregateIds: [aggregateId] } : {}})

      return aggregateId
        ? root
        : page
          ? (type ? root.filter(news => news.type === type) : root).slice(
              +page * NUMBER_OF_ITEMS_PER_PAGE - NUMBER_OF_ITEMS_PER_PAGE,
              +page * NUMBER_OF_ITEMS_PER_PAGE + 1
            )
          : root
    }
  }
}
```
