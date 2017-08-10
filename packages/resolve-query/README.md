# `resolve-query`

This package creates a function to execute a query.

## Usage

```js
import createQueryExecutor from 'resolve-query';
import createEventStore from 'resolve-es';
import createStore from 'resolve-storage';
import createEsDriver from 'resolve-storage-memory';
import createBus from 'resolve-bus';
import createBusDriver from 'resolve-bus-memory';

const esDriver = createEsDriver();
const storage = createStore({ driver: esDriver });

const busDriver = createBusDriver();
const bus = createBus({ driver: busDriver });

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
