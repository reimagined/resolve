ToDo List App Tutorial
====

This topic describes the creation process of a classic [Redux](https://github.com/reactjs/redux) example -- the **ToDo List** app. 


# Environment

Create a new reSolve application using the [create-resolve-app](https://www.npmjs.com/package/create-resolve-app) package.

```shell
npm i -g create-resolve-app
create-resolve-app my-todo-list
```

Open the `my-todo-list` folder, this is your app's working directory. You can execute the `npm run dev` command in this directory to start your app.

# Domain Research

The first thing you should do when starting the new reSolve app's development is studying your domain and determining the list of possible **events** and **commands**. A simple ToDo List receives the following commands:

* Create Item
* Toggle Item
* Remove Item

The events are absolutely similar:

* Item Created
* Item Toggled
* Item Removed

According to the events list, we can create a single aggregate that simply generates corresponding events in response to commands.

According to [CQRS](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) principle, the implementation should be separated into the **Read Side** and **Write Side**. Let'a start with the **Write Side** and implement an aggreagte.

## Write Side: Aggregate

A **reSolve Aggregate** is an object of the following structure:

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

Let's describe the **'ToDoList'** aggregate according to the domain specifics:

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

You can see that we ignore the state and unconditionally convert the commands into events. In more complex projects, you should check the state and generate exceptions in those command functions. Since we don't use the state, the `projection` functions (which infer the state from the events sequence) are not required and can be ommitted.


## Read Side: View model

In the simplest case, the Read Side consists of a [View Model](https://github.com/reimagined/resolve/blob/master/docs/View%20Models.md), which is used to infer the app's state *on the client side*. The **View Model** contains **projection functions** for every event. Each of them receives the current state with the event arguments and returns the new state.

> You can think of a **View Model** as of a [Read Model](https://reimagined.github.io/resolve/#read-model-view-model-and-query) that runs on the client side.

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

Let's assemble averything together and implement the following **View Model**:

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

Since the View Models are executed on the client side, the `state` object should be transferred to the client's browser, which means it should be easily serializable. The serialization and deserialization process is described by the `serializeState` and `deserializeState` functions. In most cases, we can use the JSON format for this.

Now we have our app's business logic fully described. Let's move to the User Interface and send some commands to our aggregate.

## User interface

The commands are invoked by calling the functions described in the aggregate's `commands` element. You should bind those functions to your UI elements and use the `state` object to show the current state.

The access to the `state` and the commands is provided by the [withViewModel](https://reimagined.github.io/resolve/packages/resolve-redux/#withviewmodel) function from the [resolve-redux](https://reimagined.github.io/resolve/packages/resolve-redux) package. Pass a React component into it and receive everything from the object passed as a parameter. Next, you can call the function returned by the `react-redux`'s [connect()](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) function with the `withViewModel`'s output as a parameter.

The code below demonstrates this:

```jsx
// ./client/components/App.js

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withViewModel } from 'resolve-redux';

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

export default connect(mapStateToProps, mapDispatchToProps)(withViewModel(App));
```

As you see, we use the current date in milliseconds as a ToDo item's **id**. This can also be any unique data, for instance, GUID.

# Auxiliary Code

We also need some auxiliary code to make things work. Consider the last three statements of the **App.js** file. They describe the connection between the Redux, React and reSolve. The functions defined and used there perform the following tasks:

* **mapStateToProps**: Uses the **Redux State** to provide the **React Props** (`todos`) to the `App` conponent.
* **mapDispatchToProp**: Uses the `bindActionCreators` function to provide the **React Callback Props** (`createItem`, `toggleItem`, and `removeItem`) to the `App` conponent.
* **withViewModel**: Uses the `viewModel` and `aggregateId` from `mapStateToProps` for binding the **React Component** (`App`) to the **reSolve View Model** (`ToDoView`).

The `aggregateId` equals to the default `'root-id'` because we have only one aggregate and there's no need to distinguish them.

The `viewModel` string is the read model's name whose state should be updated. Note that this string supports windcards so that you can update several view models.

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

The [createActions](https://reimagined.github.io/resolve/packages/resolve-redux/#createactions) function generates the dispatchable **Redux Actions** form **ReSolve Aggregate**. The module exports **Redux Actions** collected from all aggregates.

The last missing element is a **Redux Reducer**. You can create the default reducer based on the reSolve view models with the [createViewModelsReducer](https://reimagined.github.io/resolve/packages/resolve-redux/#createviewmodelsreducer) method as follows:

```jsx
// ./client/reducers/index.js

import { createViewModelsReducer } from 'resolve-redux';

export default createViewModelsReducer();
```


# Running the app

Execute the `npm run dev` command in the `my-todo-list` directory to start your app. If everything goes well, you should see the "To Do" header and the input field with the "Add Item" button in the opened browser window. 

![](todo-app-tutorial-result.png)ToDo List App Tutorial
====

This topic describes the creation process of a classic [Redux](https://github.com/reactjs/redux) example -- the **ToDo List** app. 


# Environment

Create a new reSolve application using the [create-resolve-app](https://www.npmjs.com/package/create-resolve-app) package.

```shell
npm i -g create-resolve-app
create-resolve-app my-todo-list
```

Open the `my-todo-list` folder, this is your app's working directory. You can execute the `npm run dev` command in this directory to start your app.

# Domain Research

The first thing you should do when starting the new reSolve app's development is studying your domain and determining the list of possible **events** and **commands**. A simple ToDo List receives the following commands:

* Create Item
* Toggle Item
* Remove Item

The events are absolutely similar:

* Item Created
* Item Toggled
* Item Removed

According to the events list, we can create a single aggregate that simply generates corresponding events in response to commands.

According to [CQRS](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) principle, the implementation should be separated into the **Read Side** and **Write Side**. Let'a start with the **Write Side** and implement an aggreagte.

## Write Side: Aggregate

A **reSolve Aggregate** is an object of the following structure:

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

Let's describe the **'ToDoList'** aggregate according to the domain specifics:

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

You can see that we ignore the state and unconditionally convert the commands into events. In more complex projects, you should check the state and generate exceptions in those command functions. Since we don't use the state, the `projection` functions (which infer the state from the events sequence) are not required and can be ommitted.


## Read Side: View model

In the simplest case, the Read Side consists of a [View Model](https://github.com/reimagined/resolve/blob/master/docs/View%20Models.md), which is used to infer the app's state *on the client side*. The **View Model** contains **projection functions** for every event. Each of them receives the current state with the event arguments and returns the new state.

> You can think of a **View Model** as of a [Read Model](https://reimagined.github.io/resolve/#read-model-view-model-and-query) that runs on the client side.

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

Let's assemble averything together and implement the following **View Model**:

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

Since the View Models are executed on the client side, the `state` object should be transferred to the client's browser, which means it should be easily serializable. The serialization and deserialization process is described by the `serializeState` and `deserializeState` functions. In most cases, we can use the JSON format for this.

Now we have our app's business logic fully described. Let's move to the User Interface and send some commands to our aggregate.

## User interface

The commands are invoked by calling the functions described in the aggregate's `commands` element. You should bind those functions to your UI elements and use the `state` object to show the current state.

The access to the `state` and the commands is provided by the [withViewModel](https://reimagined.github.io/resolve/packages/resolve-redux/#withviewmodel) function from the [resolve-redux](https://reimagined.github.io/resolve/packages/resolve-redux) package. Pass a React component into it and receive everything from the object passed as a parameter. Next, you can call the function returned by the `react-redux`'s [connect()](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) function with the `withViewModel`'s output as a parameter.

The code below demonstrates this:

```jsx
// ./client/components/App.js

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withViewModel } from 'resolve-redux';

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

export default connect(mapStateToProps, mapDispatchToProps)(withViewModel(App));
```

As you see, we use the current date in milliseconds as a ToDo item's **id**. This can also be any unique data, for instance, GUID.

# Auxiliary Code

We also need some auxiliary code to make things work. Consider the last three statements of the **App.js** file. They describe the connection between the Redux, React and reSolve. The functions defined and used there perform the following tasks:

* **mapStateToProps**: Uses the **Redux State** to provide the **React Props** (`todos`) to the `App` conponent.
* **mapDispatchToProp**: Uses the `bindActionCreators` function to provide the **React Callback Props** (`createItem`, `toggleItem`, and `removeItem`) to the `App` conponent.
* **withViewModel**: Uses the `viewModel` and `aggregateId` from `mapStateToProps` for binding the **React Component** (`App`) to the **reSolve View Model** (`ToDoView`).

The `aggregateId` equals to the default `'root-id'` because we have only one aggregate and there's no need to distinguish them.

The `viewModel` string is the read model's name whose state should be updated. Note that this string supports windcards so that you can update several view models.

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

The [createActions](https://reimagined.github.io/resolve/packages/resolve-redux/#createactions) function generates the dispatchable **Redux Actions** form **ReSolve Aggregate**. The module exports **Redux Actions** collected from all aggregates.

The last missing element is a **Redux Reducer**. You can create the default reducer based on the reSolve view models with the [createViewModelsReducer](https://reimagined.github.io/resolve/packages/resolve-redux/#createviewmodelsreducer) method as follows:

```jsx
// ./client/reducers/index.js

import { createViewModelsReducer } from 'resolve-redux';

export default createViewModelsReducer();
```


# Running the app

Execute the `npm run dev` command in the `my-todo-list` directory to start your app. If everything goes well, you should see the "To Do" header and the input field with the "Add Item" button in the opened browser window. 
