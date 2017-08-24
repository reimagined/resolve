# **:mag: resolve-query**

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
    }
}];

const query = createQueryExecutor({ eventStore, readModels });
query('users').then(state => {
    console.log('Read model Users', state);
});
```
