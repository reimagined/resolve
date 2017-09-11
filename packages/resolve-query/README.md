# **🔍 resolve-query** [![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

Provides a function to execute a query and get required information from a [read model](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models).

## Usage
When initializing a query, pass the following arguments:

* `eventStore` - configured [eventStore](https://github.com/reimagined/resolve/tree/master/packages/resolve-es) instance
* `readModels` - array of [read models](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#%EF%B8%8F-aggregates-and-read-models)  
	
After the query is initialized, you get a function that is used to get data from read models by [GraphQL](http://graphql.org/learn/) request. This function receives the following arguments:
 * `readModelName` (required) - read model name
 * `qraphQLQuery` (required) - GraphQL query to get data 
 * `graphQLVariables` - specify it, if `graphQLQuery` contains variables
 * `getJwt` - callback for retrieve actual client state stored in verified JWT token
 
 ### Example
Let's implement the Read Model for building News state with custom GraphQL resolvers. It will handle the same events that are produced in [Aggregate example](https://github.com/reimagined/resolve/tree/master/packages/resolve-command#example).

```js
import Immutable from 'seamless-immutable'

export default {
  name: 'news',
  initialState: Immutable([]),
  eventHandlers: {
    NEWS_CREATED: (state, { 
        aggregateId, 
        timestamp,
        payload: { 
            title, link, userId, text 
        } 
    }) => {
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

    NEWS_UPVOTED: (state, { aggregateId, payload: { userId } }) => {
      const index = state.findIndex(({ id }) => id === aggregateId)

      if (index < 0) {
        return state
      }

      return state.updateIn([index, 'votes'], votes => votes.concat(userId))
    },

    NEWS_UNVOTED: (state, { aggregateId, payload: { userId } }) => {
      const index = state.findIndex(({ id }) => id === aggregateId)

      if (index < 0) {
        return state
      }

      return state.updateIn([index, 'votes'], votes =>
        votes.filter(id => id !== userId)
      )
    },

    NEWS_DELETED: (state, { aggregateId }) =>
      state.filter(({ id }) => id !== aggregateId),

    COMMENT_CREATED: (state, { aggregateId, payload: { parentId, commentId } }) => {
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

    COMMENT_REMOVED: (state, { aggregateId, payload: { parentId, commentId } }) => {
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
    news: (root, { page, aggregateId, type }) =>
      aggregateId
        ? root
        : page
          ? (type ? root.filter(news => news.type === type) : root).slice(
              +page * NUMBER_OF_ITEMS_PER_PAGE - NUMBER_OF_ITEMS_PER_PAGE,
              +page * NUMBER_OF_ITEMS_PER_PAGE + 1
            )
          : root
  }
}
```
