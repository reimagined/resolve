# **🔍 resolve-query** [![npm version](https://badge.fury.io/js/resolve-query.svg)](https://badge.fury.io/js/resolve-query)

This package creates a function to execute a query.

## Usage

```js
import createQueryExecutor from 'resolve-query';
import createEventStore from 'resolve-es';
import createEsStorage from 'resolve-storage-memory';
import createBusDriver from 'resolve-bus-memory';

const storage = createEsStorage();

const bus = createBusDriver();

const eventStore = createEventStore({ storage, bus });

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
}];

const query = createQueryExecutor({ eventStore, readModels });

// Request whole read-model state
query('users').then(state => {
    console.log('Read model Users', state);
});

// Request by GraphQL query without paramaters
query('users', 'query { Users { id, UserName } }').then(state => {
    console.log('Read model Users', state);
});

// Request by GraphQL query with paramaters
query(
    'users',
    'query ($testId: ID!) { UserById(id: $testId) { id, UserName } }',
    { testId: 1 }
).then(state => {
    console.log('Read model Users', state);
});

```
