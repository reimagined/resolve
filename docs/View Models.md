## Basic concepts

A [view model](https://github.com/reimagined/resolve/tree/master#read-model-view-model-and-query) is a [read model](https://github.com/reimagined/resolve/tree/master#read-model-view-model-and-query) that represents a part of UI state and can live on the client. It can be updated by a Redux `reducer` function on the client and on the server.

## ViewModel Reference Type 

```
type ViewModel = {
    name: String
    projection: {
        Init: Void -> State
        [EventType]: (State, Event) -> State
        ...
    }
    serializeState: State -> String
    deserializeState: String -> State
}
```

```
type State = Immutable<Object|Array> 
```

```
type Event = {
    aggregateId: UUID
    timestamp: Date
    type: EventType
    payload: Any
}
```

``` 
type EventType = String
```

## How does it work on the client side with Redux
#### Subscribe/unsubscribe to/from a view model by aggregateId

[`componentDidMount()`](https://reactjs.org/docs/react-component.html#componentdidmount) is called immediately after a component is installed.
Use this method to subscribe to events. If you do that, don’t forget to unsubscribe from events using [`componentWillUnmount()`](https://reactjs.org/docs/react-component.html#componentwillunmount).

[`componentWillUnmount()`](https://reactjs.org/docs/react-component.html#componentwillunmount) is invoked immediately before a component is unmounted and destroyed. Use this method to unsubscribe from events.

To automate this process, use the [`withViewModel`](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#withviewmodel) higher-order component (HOC).

```js
const mapStateToProps = state => ({
    ...state[viewModel][aggregateId],
    viewModel, // required field
    aggregateId // required field
});

export default connect(mapStateToProps)(withViewModel(Component));
```

#### Request for Initial State

[`createResolveMiddleware`](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#resolvemiddleware) handles the `SUBSCRIBE` action and requests an initial state of a view model with the specified aggregateId from the server.

#### Subscribe to Events

After receiving initialState, [`createResolveMiddleware`](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#resolvemiddleware) subscribes to events setting up a web socket connection.

#### Unsubscribe from Events

[`createResolveMiddleware`](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#resolvemiddleware) handles the `UNSUBSCRIBE` action, removes a state of a view model with the specified aggregateId and unsubscribes from events setting up a web socket connection.

#### How to add [`createResolveMiddleware`](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#resolvemiddleware) to [Store](https://redux.js.org/docs/api/createStore.html)
``` js
import { createStore, applyMiddleware } from 'redux';
import { createResolveMiddleware, createViewModelsReducer } from 'resolve-redux';
import viewModels from '../../common/view-models';

const reducer = createViewModelsReducer();
const middleware = [createResolveMiddleware(viewModels)];

export default initialState => createStore(reducer, initialState, applyMiddleware(...middleware));
```

## How does it work on the server side with ReSolve

#### Request for Initial State

A query receives the current state of a view model with the specified aggregateId. If the specified view model's state is in the cache, it is returned on the client as initialState. Otherwise, all events from [EventStore](https://github.com/reimagined/resolve/tree/master#event-store) that have the specified aggregateId and are handled by the view model are loaded, and the state is built based on them. The result is stored in the cache and sent to the client.

#### Subscribe/Unsubscribe to/from Events

All events saved to [EventStore](https://github.com/reimagined/resolve/tree/master#event-store) are also sent to the bus in real time. The client receives events if it has an active subscription to events with the specified aggregateId and eventTypes.

## TL;DR
* [Link to Github "ToDo App"](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels)
* [Link to Github "Two Level ToDo App"](https://github.com/reimagined/resolve/tree/master/examples/todo)

