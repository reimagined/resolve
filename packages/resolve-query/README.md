# **🔍 resolve-query**

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
    name: 'usersSimple',
    initialState: [],
    eventHandlers: {
        UserCreated: (state, { payload })  => state.concat(payload)
    }
}, {
    name: 'usersGraphQL',
    initialState: { Users: [] },
    eventHandlers: {
        UserAdded: (state, { aggregateId: id, payload: { UserName } }) => {
            if (state.Users.find(user => user.id === id)) return state;
            state.Users.push({ id, UserName });
            return state;
        },
        UserDeleted: (state, { aggregateId: id }) => {
            state.Users = state.Users.filter(user => user.id !== id);
            return state;
        }
    },
    gqlSchema: `
        type User {
            id: ID!
            UserName: String
        }
        type Query {
            Users: [User],
            UserById(id: ID!): User
        }
    `,
    gqlResolvers: {
        UserById: (root, args) => root.Users.find(user => user.id === args.id)
    }
}];

const query = createQueryExecutor({ eventStore, readModels });

query('usersSimple').then(state => {
    console.log('Read model Users', state);
});

query('usersGraphQL', 'query { Users { id, UserName } }').then(state => {
    console.log('Read model Users', state);
});
```
