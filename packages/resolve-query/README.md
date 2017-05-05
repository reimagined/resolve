# `resolve-query`

This package serves as a query handler.

## Usage

```js
import createQuery from 'resolve-query';
import createStore from 'resolve-es';
import createEsDriver from 'resolve-es-memory';
import createBus from 'resolve-bus';
import createBusDriver from 'resolve-bus-memory';

const esDriver = createEsDriver();
const store = createStore({ driver: esDriver });

const busDriver = createBusDriver();
const bus = createBus({ driver: busDriver });

const projections = {
    User: {
        initialState: [],
        eventHandlers: {
            UserCreated(state, event) {
                return state.concat(event.payload);
            }
        }
    }
};

const query = createQuery({ store, bus, projections });
const state = query('User');
```
