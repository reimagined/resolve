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

```js
import createQueryExecutor from 'resolve-query'
import createEventStore from 'resolve-es'
import createStorageDriver from 'resolve-storage-memory'
import createBusDriver from 'resolve-bus-memory'

const eventStore = createEventStore({ 
    storage: createStorageDriver(), 
    bus: createBusDriver()
})

const readModels = [{
  name: 'users',
  initialState: [],
  eventHandlers: {
    UserCreated: (state, { payload })  => state.concat(payload)
  },
  gqlSchema: `
    type User { id: ID!, UserName: String }
    type Query { Users: [User], UserById(id: ID!): User }
  `,
  gqlResolvers: {
    Users: root => root,
    UserById: (root, args) => root.find(user => user.id === args.id)
  }
}]

const query = createQueryExecutor({ eventStore, readModels })

// Request whole read-model state
query('users').then(state => {
  console.log('Read model Users', state)
})

// Request by GraphQL query without paramaters
query('users', 'query { Users { id, UserName } }').then(state => {
  console.log('Read model Users', state)
})

// Request by GraphQL query with paramaters
query(
  'users',
  'query ($testId: ID!) { UserById(id: $testId) { id, UserName } }',
  { testId: 1 }
).then(state => {
  console.log('Read model Users', state)
})
```
