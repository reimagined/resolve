# View Model

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

The **view models** are sent to the client UI to be a part of a Redux app state. They are small enough to fit into memory and kept up to date in the browser. They are defined in a special isomorphic format, which allows them to be used on the client and server side.

A typical view model structure:

```js
export default [
  {
    name: 'Todos',
    projection: {
      Init: () => ({}),
      ITEM_CREATED: (state, { payload: { id, text } }) => ({
        ...state,
        [id]: {
          text,
          checked: false
        }
      }),
      ITEM_TOGGLED: (state, { payload: { id } }) => ({
        ...state,
        [id]: {
          ...state[id],
          checked: !state[id].checked
        }
      }),
      ITEM_REMOVED: (state, { payload: { id } }) => {
        const nextState = { ...state }
        delete nextState[id]
        return nextState
      }
    },
    serializeState: state => JSON.stringify(state),
    deserializeState: state => JSON.parse(state)
  }
]

```

View models are also available via the facade at `/api/query/VIEW_MODEL_NAME` with a simple GET-query that supports two required parameters: `aggregateIds` and `eventTypes`. A typical query to a view model is `/api/query/VIEW_MODEL_NAME?aggregateIds=id1&aggregateIds=id2`. It builds the view model state for all events that relate to aggregates with `id1` or `id2`.

Note: Some Immutable wrapper for a state object is required to use view model declaration as a Redux reducer. We recommend using the [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) library. Keep in mind that incorrectly handling an immutable object may cause performance issues.

### How does it work on the client side with Redux
#### Subscribe/unsubscribe to/from a view model by aggregateId

[`componentWillMount()`](https://reactjs.org/docs/react-component.html#componentwillmount) is invoked immediately before mounting occurs.
Use this method to subscribe to events. If you do that, don’t forget to unsubscribe from events using [`componentWillUnmount()`](https://reactjs.org/docs/react-component.html#componentwillunmount).

[`componentWillUnmount()`](https://reactjs.org/docs/react-component.html#componentwillunmount) is invoked immediately before a component is unmounted and destroyed. Use this method to unsubscribe from events.

To automate this process, use the [`connect`](../packages/resolve-redux#connect) higher-order component (HOC).

```js
import { connect } from 'resolve-redux';

const mapStateToProps = state => ({
    ...state[viewModelName][aggregateId],
    viewModelName, // required field
    aggregateId // required field
});

export default connect(mapStateToProps)(Component);
```

#### Request for Initial State

[`createResolveMiddleware`](../packages/resolve-redux#createresolvemiddleware) handles the `SUBSCRIBE` action and requests an initial state of a view model with the specified aggregateId from the server.

#### Subscribe to Events

After receiving initialState, [`createResolveMiddleware`](../packages/resolve-redux#createresolvemiddleware) subscribes to events setting up a web socket connection.

#### Unsubscribe from Events

[`createResolveMiddleware`](../packages/resolve-redux#createresolvemiddleware) handles the `UNSUBSCRIBE` action, removes a state of a view model with the specified aggregateId and unsubscribes from events setting up a web socket connection.

#### How to add [`createResolveMiddleware`](../packages/resolve-redux#createresolvemiddleware) to [Store](https://redux.js.org/docs/api/createStore.html)
``` js
import { createStore, applyMiddleware } from 'redux';
import { createResolveMiddleware, createViewModelsReducer } from 'resolve-redux';
import viewModels from '../../common/view-models';

const reducer = createViewModelsReducer();
const middleware = [createResolveMiddleware(viewModels)];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
```

### How does it work on the server side with reSolve
#### Request for Initial State

A query receives the current state of a view model with the specified aggregateId. If the specified view model's state is in the cache, it is returned on the client as initialState. Otherwise, all events from [EventStore](https://github.com/reimagined/resolve/blob/master/docs/Event%20Store.md) that have the specified aggregateId and are handled by the view model are loaded, and the state is built based on them. The result is stored in the cache and sent to the client.

#### Subscribe/Unsubscribe to/from Events

All events saved to [EventStore](https://github.com/reimagined/resolve/blob/master/docs/Event%20Store.md) are also sent to the bus in real time. The client receives events if it has an active subscription to events with the specified aggregateId and eventTypes.

## TL;DR
* [Link to Github "ToDo App"](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels)
* [Link to Github "Two Level ToDo App"](https://github.com/reimagined/resolve/tree/master/examples/todo)

