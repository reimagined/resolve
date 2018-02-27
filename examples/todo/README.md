ToDo List App Tutorial
====

This topic describes how to create a classic [Redux](https://github.com/reactjs/redux) example -- the **ToDo List** app. 


# Environment

Create a new reSolve application using the [create-resolve-app](https://www.npmjs.com/package/create-resolve-app) package.

```shell
npm i -g create-resolve-app
create-resolve-app my-todo-list
```

Open your app's working directory (`my-todo-list`). You can execute the `npm run dev` command in this directory to start your app.

# Domain Research

You should have extensive knowledge about your domain and use it to compose the list of possible **events** and **commands** before developing a new reSolve app's development. The **ToDo List** app's commands and events are presented below in the "`[command]` -> `[event]`" format:

* Create Item -> Item Created
* Toggle Item -> Item Toggled
* Remove Item -> Item Removed

We can create a single aggregate that unconditionally generates corresponding events in response to commands according to the events list.

According to [CQRS](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) principle, the implementation should be separated into the **Read Side** and **Write Side**. The first step is implementing an aggregate on the  **Write Side**.

## Write Side: Aggregate

A **reSolve Aggregate** is an object with the following structure:

```jsx
{
    name: 'AggregateName',
    initialState: {}, // Initial state (Bounded context) for every instance of this aggregate type
    projection: {
        Event1Happened: (state, event) => nextState,    // Update functions for the current aggregate instance
        Event2Happened: (state, event) => nextState     // for different event types
        // ...
    },
    commands: {
        command1Name: (state, command) => generatedEvent1, // Function which generates events depending 
        command2Name: (state, command) => generatedEvent2  // on the current state and argument list
        // ...
    }
}
```

The **'ToDoList'** aggregate's description looks as follows:

```jsx
// ./common/aggregates/index.js

export default [
    {
        name: 'ToDoList',
        commands: {
            createItem: (_, { payload: { id, text } }) => ({
                type: 'ITEM_CREATED',
                payload: { id, text }
            }),
            toggleItem: (_, { payload: { id } }) => ({
                type: 'ITEM_TOGGLED',
                payload: { id }
            }),
            removeItem: (_, { payload: { id } }) => ({
                type: 'ITEM_REMOVED',
                payload: { id }
            })
        }
    }
];
```

We ignore the state and unconditionally convert the commands into events. In more complex projects, you should check the state and generate exceptions in those command functions. The `projection` functions (which infer the state from the events sequence) are not required and can be omitted because we do not use the state.


## Read Side: View model

In its basic form, the Read Side can consist of a [View Model](../../docs/View%20Models.md) only, which is similar to a [Read Model](../../README.md#read-model-view-model-and-query) and used to infer the app's state *on the client side*. The **View Model** contains **projection functions** for every event, which each receive the current state with the event arguments and return the new state.

The best way to store a ToDo list is using the key-value map: we can use a command's `id` as a key and store an object with the following structure for each event:

```jsx
{
    text: "Learn reSolve",
    checked: false
}
```

The **reSolve View Model** objects have the following structure:

```jsx
export default {
    name: 'ViewModelName',
    projection: {
        Init: () => initialState,
        receivedEvent1: (state, event) => nextState,    // Update functions for the current view model instance
        receivedEvent2: (state, event) => nextState     // for different event types
        // ...
    }
    // This state results from the request to the query handler at the current moment
};
```

Assemble everything and implement the following **View Model**:

```jsx
// ./common/view-models/index.js

export default [
    {
        name: 'ToDoView',
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
                const nextState = { ...state };
                delete nextState[id];
                return nextState;
            }
        },
        serializeState: state => JSON.stringify(state),
        deserializeState: state => JSON.parse(state)
    }
];
```

Since the View Models are executed on the client side, the `state` object should be transferred to the client's browser. The `serializeState` and `deserializeState` functions perform the serialization and deserialization process. In most cases, we can use the JSON format for this.

Now we have described our app's business logic.

## User Interface

Next, create a User Interface to send commands to the aggregate. The commands are invoked by calling the functions described in the aggregate's `commands` element. You should bind these functions to your UI elements and use the `state` object to show the current state.

The [resolve-redux](../../packages/resolve-redux) package's [connect](../../packages/resolve-redux/README.md#connect) function provides access to the `state` and commands. Pass a React component to it and receive everything from the object passed as a parameter. Next, call the function returned from the `react-redux`'s [connect()](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) function with the `withViewModel`'s output as a parameter.

The [resolve-redux's](../../packages/resolve-redux) [connect()](../../packages/resolve-redux/README.md#connect) function is similar to the react-redux's connect(), but in addition to connecting a React component to a Redux store it also uses the viewModel and aggregateId from mapStateToProps to bind the React Component (App) to the reSolve View Model (ToDoView).

The code below demonstrates this:

```jsx
// ./client/components/App.js

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'resolve-redux';

import actions from '../actions';

const App = ({ todos, createItem, toggleItem, removeItem, aggregateId }) => {
    let newToDo;
    return (
        <div>
            <h1>To Do</h1>
            <ol>
                {Object.keys(todos).map(id => (
                    <li key={id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={todos[id].checked}
                                onChange={toggleItem.bind(null, aggregateId, { id })}
                            />
                            {todos[id].text}
                        </label>
                        <span onClick={removeItem.bind(null, aggregateId, { id })}>{' [x]'}</span>
                    </li>
                ))}
            </ol>
            <input type="text" ref={element => (newToDo = element)} />
            <button
                onClick={() => {
                    createItem(aggregateId, {
                        text: newToDo.value,
                        id: Date.now()
                    });
                    newToDo.value = '';
                }}
            >
                Add Item
            </button>
        </div>
    );
};

const mapStateToProps = (state) => {
    const aggregateId = 'root-id';
    const viewModel = 'ToDoView';
    return {
        viewModel,
        aggregateId,
        todos: state[viewModel][aggregateId]
    };
};

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(App);
```

We use the current date in milliseconds as a ToDo item's **id**. This can be any unique data, for instance, GUID.

# Auxiliary Code

The last three statements of the **App.js** file describe the connection between the Redux, React and reSolve. The functions they define and use, perform the following tasks:

* **mapStateToProps**: Uses the **Redux State** to provide the **React Props** (`todos`) to the `App` component.
* **mapDispatchToProp**: Uses the `bindActionCreators` function to provide the **React Callback Props** (`createItem`, `toggleItem`, and `removeItem`) to the `App` component.
* **withViewModel**: Uses the `viewModel` and `aggregateId` from `mapStateToProps` to bind the **React Component** (`App`) to the **reSolve View Model** (`ToDoView`).

The `aggregateId` is equal to the default `'root-id'` because we have only one aggregate and do not need to distinguish between them.

The `viewModel` is the name of the read model whose state should be updated. Note that this string supports wildcards for updating several view models.

The [bindActionCreators](https://redux.js.org/docs/api/bindActionCreators.html) Redux function requires the `actions` object, which is described as follows and imported in the **App.js** file:

```jsx
// ./client/actions/index.js

import { createActions } from 'resolve-redux';

import aggregates from '../../common/aggregates';

export default aggregates.reduce(
    (result, aggregate) => ({ ...result, ...createActions(aggregate) }),
    {}
);
```

The [createActions](../../packages/resolve-redux/README.md#createactions) function generates the dispatchable **Redux Actions** from a **reSolve Aggregate**. The module exports **Redux Actions** collected from all aggregates.

The last missing element is a **Redux Reducer**. You can create a default reducer based on the reSolve view models with the [createViewModelsReducer](../../packages/resolve-redux/README.md#createviewmodelsreducer) method as follows:

```jsx
// ./client/reducers/index.js

import { createViewModelsReducer } from 'resolve-redux';

export default createViewModelsReducer();
```


# Running the app

Execute the `npm run dev` command in the `my-todo-list` directory to start your app. You should see the "To Do" header and an input field with an "Add Item" button in the opened browser window: