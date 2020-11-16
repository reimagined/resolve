---
id: tutorial
title: Step-by-Step Tutorial
---

This document provides a step-by-step tutorial for the reSolve framework.
Throughout this tutorial, you will iteratively develop a ShoppingList application and learn fundamental concepts of the reSolve framework.

We recommend that your familiarize yourself with basics of event sourcing and CQRS before you start this tutorial. You can find a curated list of resources in the [FAQ](faq.md).

## Table of Contents

- [Lesson 1 - Create a New reSolve Application](#lesson-1-create-a-new-resolve-application)
- [Lesson 2 - Write side - Add a List Item](#lesson-2-write-side-add-a-list-item)
- [Lesson 3 - Read side - Create a View Model to Query List Items](#lesson-3-read-side-create-a-view-model-to-query-list-items)
- [Lesson 4 - Frontend - Display View Model Data in the Browser](#lesson-4-frontend-display-view-model-data-in-the-browser)
- [Lesson 5 - Frontend - Enable Data Editing](#lesson-5-frontend-enable-data-editing)
- [Lesson 6 - Frontend - Support Multiple Shopping Lists](#lesson-6-frontend-support-multiple-shopping-lists)

---

## **Lesson 1** - Create a New reSolve Application

Use the create-resolve-app tool to create a new reSolve app:

##### npm:

```sh
$ npm i -g create-resolve-app
$ create-resolve-app shopping-list
```

##### npx:

```sh
$ npx create-resolve-app shopping-list
```

##### yarn:

```sh
$ yarn create resolve-app shopping-list
```

After this, a minimal reSolve application is ready. To run it in development mode, type:

```sh
$ cd shopping-list
$ yarn run dev
```

---

## **Lesson 2** - Write side - Add a List Item

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-2)

This lesson describes how to implement a basic write side for a reSolve application. An application's [write side](resolve-app-structure.md#write-and-read-sides) handles commands, performs input validation, and emits **events** based on valid commands. The framework then saves the emitted events to the **event store**.

### Create an Aggregate

Define types of events that the write side can produce. Create an **eventTypes.js** file in the project's **common** folder and add the following content to it:

**common/eventTypes.js:**

```js
export const SHOPPING_LIST_CREATED = 'SHOPPING_LIST_CREATED' // Indicates the creation of a shopping list

export const SHOPPING_ITEM_CREATED = 'SHOPPING_ITEM_CREATED' // Indicates the creation of an item within a shopping list
```

Next, define an aggregate that handles commands and produces the defined events as the result. Create a **shopping_list.commands.js** file in the **common/aggregates** and add the following code to it:

**common/aggregates/shopping_list.commands.js:**

```js
import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

// This file exports an object that contains two command handlers
export default {
  // A command handler receives the aggregate state and a command payload.
  // A payload can contain arbitrary data related to the command.
  // For example, the "createShoppingList" command's payload contains the shopping list's name.
  createShoppingList: (state, { payload: { name } }) => {
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name }
    }
  },
  // The "createShoppingItem" command's payload contains an item's ID and display text.
  createShoppingItem: (state, { payload: { id, text } }) => {
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    }
  }
}
```

A command handler returns an **event** object. This object should contain the following fields:

- **type** - specifies the event's type;
- **payload** - specifies data associated with the event.

The reSolve framework saves events that command handlers return to a persistent **[event store](write-side.md#event-store)**. Your application is already configured to use a SQLite event store. We suggest that you keep this configuration throughout the tutorial. For information on how to use other storage types see the following documentation topics:

- [Adapters](https://github.com/reimagined/resolve/blob/master/docs/advanced-techniques.md#adapters)
- [Configuring Adapters](https://github.com/reimagined/resolve/blob/master/docs/preparing-to-production.md#configuring-adapters)

Your shopping list aggregate is now ready. The last step is to register it in the application's configuration file. To do this, open the **config.app.js** file and specify the following settings in the **aggregates** configuration section:

**config.app.js:**

```js
...
aggregates: [
  {
    name: 'ShoppingList',
    commands: 'common/aggregates/shopping_list.commands.js',
  }
],
...
```

### Sending Commands to an Aggregate

Now that your application can handle commands, you can use the reSolve framework's HTTP API to send such commands to create a shopping list and populate it with items.

A request body should have the `application/json` content type and contain a JSON representation of the command:

```
{
  "aggregateName": "ShoppingList",
  "type": "createShoppingList",
  "aggregateId": "shopping-list-1",
  "payload": {
    "text": "Item 1"
  }
}
```

In addition to the aggregate name, command type and payload, this object specifies the aggregate's ID.

Run your application and send a POST request to the following URL:

```
http://127.0.0.1:3000/api/commands
```

You can use any REST client or **curl** to do this. For example, use the following inputs to create a shopping list:

```sh
curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "shopping-list-1",
    "type": "createShoppingList",
    "payload": {
        "name": "List 1"
    }
}
'

X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Date: Wed, 21 Oct 2020 09:53:03 GMT
Connection: keep-alive
Content-Length: 169

{
  "aggregateId": "shopping-list-1",
  "aggregateVersion": 1,
  "timestamp": 1603273983423,
  "type": "SHOPPING_LIST_CREATED",
  "payload": {
    "name": "List 1"
  }
}
```

Use the inputs shown below to add an item to the created shopping list:

```sh
curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "shopping-list-1",
    "type": "createShoppingItem",
    "payload": {
        "id": "1",
        "text": "Milk"
    }
}
'

X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Date: Wed, 21 Oct 2020 09:53:57 GMT
Connection: keep-alive
Content-Length: 182

{
  "aggregateId": "shopping-list-1",
  "aggregateVersion": 2,
  "timestamp": 1603274037307,
  "type": "SHOPPING_ITEM_CREATED",
  "payload": {
    "id": "1",
    "text": "Milk"
  }
}
```

You can now check the event store database to see the newly created events. To do this, use the [Command Line Shell For SQLite](https://sqlite.org/cli.html) or any compatible database management tool:

<!-- prettier-ignore-start -->

```sh
sqlite3 data/event-store.db
sqlite> select * from events;
40|0|1603273983433|shopping-list-1|1|SHOPPING_LIST_CREATED|{"name":"List 1"}
147|0|1603274037313|shopping-list-1|2|SHOPPING_ITEM_CREATED|{"id":"1","text":"Milk"}
```

<!-- prettier-ignore-end -->

### Performing Validation

Your application's write side currently does not perform any input validation. This results in the following issues:

- The command handlers do not check whether all required fields are provided in a command's payload.
- It is possible to create more then one shopping list with the same aggregate ID.
- You can create items in a nonexistent shopping list.

To overcome the first issue, add checks at the beginning of each command handler:

**common/aggregates/shopping_list.commands.js:**

```js
createShoppingList: (state, { payload: { name } }) => {
  if (!name) throw new Error("name is required");
  ...
},
createShoppingItem: (state, { payload: { id, text } }) => {
  if (!id) throw new Error('id is required')
  if (!text) throw new Error('text is required')
  ...
}
```

To overcome the second and third issues, you need to have an **aggregate state** object that keeps track of what shopping lists were already created. Such object can be assembled on the fly by an aggregate **projection** from previously created events. To add a projection to the ShoppingList aggregate, create a **shopping_list.projection.js** file in the **common/aggregates** folder and add the following code there:

**common/aggregates/shopping_list.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.projection.js /^/ /\n$/)
```js
import { SHOPPING_LIST_CREATED } from "../eventTypes";

export default {
  Init: () => ({}),
  [SHOPPING_LIST_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp
  })
};
```

<!-- prettier-ignore-end -->

Register the create projection in the application's configuration file:

**config.app.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-2/config.app.js /^[[:blank:]]+aggregates:/ /\],/)
```js
  aggregates: [
    {
      name: "ShoppingList",
      commands: "common/aggregates/shopping_list.commands.js",
      projection: "common/aggregates/shopping_list.projection.js"
    }
  ],
```

<!-- prettier-ignore-end -->

The projection object specifies an **Init** function and a set of **projection functions**.

- The **Init** function initializes the aggregate state. In the example code, it creates a new empty object.
- Projection functions build the aggregate state based on the aggregate's events. Each such function is associated with a particular event type. The function receives the previous state and an event, and returns a new state based on the input.

In the example code, the SHOPPING_LIST_CREATED projection function adds the SHOPPING_LIST_CREATED event's timestamp to the state. This information can be used on the write side to find out whether and when a shopping list was created for the current aggregate instance (an instance that the current aggregate ID identifies).

**common/aggregates/shopping_list.commands.js:**

```js
  createShoppingList: (state, { payload: { name } }) => {
    if (state.createdAt) throw new Error("shopping List already exists");
    ...
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    if (!state || !state.createdAt) {
      throw new Error(`shopping list does not exist`);
    }
    ...
  }
```

You can send commands to your aggregate to check whether the validation works as intended:

```sh
# Trying to create a shopping list without specifying the name
$ curl -i http://localhost:3000/api/commands/ \
> --header "Content-Type: application/json" \
> --data '
> {
>     "aggregateName": "ShoppingList",
>     "aggregateId": "shopping-list-2",
>     "type": "createShoppingList",
>     "payload": { }
> }
> '
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   164  100    31  100   133    142    610 --:--:-- --:--:-- --:--:--   655HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Date: Thu, 22 Nov 2018 11:14:10 GMT
Connection: keep-alive
Content-Length: 31

Command error: name is required


# When you create a shopping list that already exists
$ curl -i http://localhost:3000/api/commands/ \
> --header "Content-Type: application/json" \
> --data '
> {
>     "aggregateName": "ShoppingList",
>     "aggregateId": "shopping-list-1",
>     "type": "createShoppingList",
>     "payload": {
>         "name": "List 1"
>     }
> }
> '
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   205  100    43  100   162    196    739 --:--:-- --:--:-- --:--:--   798HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Date: Thu, 22 Nov 2018 11:11:18 GMT
Connection: keep-alive
Content-Length: 43

Command error: the shopping list already exists


# Trying to add an item to an inexistent shopping list
$ curl -i http://localhost:3000/api/commands/ \
> --header "Content-Type: application/json" \
> --data '
> {
>     "aggregateName": "ShoppingList",
>     "aggregateId": "shopping-list-4000",
>     "type": "createShoppingItem",
>     "payload": {
>         "id": "5",
>         "text": "Bread"
>     }
> }
> '
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   226  100    43  100   183    211    901 --:--:-- --:--:-- --:--:--   901HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Date: Thu, 22 Nov 2018 11:16:56 GMT
Connection: keep-alive
Content-Length: 43

Command error: the shopping list does not exist
```

---

## **Lesson 3** - Read side - Create a Read Model to Query Shopping Lists

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-3)

Currently, your shopping list application has a write side that allows you to create shopping lists and items in these lists. To obtain this data from the application, you need to implement the application's **[read side](resolve-app-structure.md#write-and-read-sides)**.

### Add a Read Model

Add a **ShoppingLists** **[Read Model](read-side.md#read-models)** to your application. To do this, create a **shopping_list.projection.js** file in the **read-models** folder and add the following code to this file:

**common/read-models/shopping_lists.projection.js:**

```js
import { SHOPPING_LIST_CREATED } from '../eventTypes'

export default {
  Init: async store => {
    await store.defineTable('ShoppingLists', {
      indexes: {
        id: 'string'
      },
      fields: ['createdAt', 'name']
    })
  },

  [SHOPPING_LIST_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const shoppingList = {
      id: aggregateId,
      name,
      createdAt: timestamp
    }

    await store.insert('ShoppingLists', shoppingList)
  }
}
```

This code defines a Read Model **[projection](read-side.md#updating-a-read-model-via-projection-functions)**. A projection function builds a state from incoming events and saves it to a persistent store. The type of the store that is used is defined by a Read Model connector:

**config.dev.js:**

```js
// This files defines setting used only in the development environment
const devConfig = {
  readModelConnectors: {
    // This is the 'default' Read Model connector.
    // It connects a Read Model to a SQLite data
    default: {
      module: 'resolve-readmodel-lite',
      options: {
        databaseFile: 'data/read-models.db'
      }
    }
    // You can reconfigure the connector to use other database types:
    /*
      default: {
        module: 'resolve-readmodel-mysql',
        options: {
          host: 'localhost',
          port: 3306,
          user: 'customUser',
          password: 'customPassword',
          database: 'customDatabaseName'
        }
      }
    */
  }
}
```

You also need to implement a query resolver to answer data queries based on the data from the store.

**common/read-models/shopping_lists.resolvers.js:**

```js
export default {
  // The 'all' resolver returns all entries from the 'ShoppingLists' table.
  all: async store => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  }
}
```

Register the created Read Model in the application configuration file:

**config.app.js**

```js
...
readModels: [
  {
    name: 'ShoppingLists',
    projection: 'common/read-models/shopping_lists.projection.js',
    resolvers: 'common/read-models/shopping_lists.resolvers.js',
    connectorName: 'default'
  }
],
```

### Query a Read Model

You can use the standard HTTP API to test the ShoppingLists Read Model's functionality:

```sh
$ curl -X POST \
-H "Content-Type: application/json" \
-d "{}" \
"http://localhost:3000/api/query/ShoppingLists/all"

% Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   186  100   184  100     2    844      9 --:--:-- --:--:-- --:--:--   906[
  {
    "id": "shopping-list-1",
    "name": "List 1",
    "createdAt": 1543325125945
  },
  {
    "id": "shopping-list-2",
    "name": "List 2",
    "createdAt": 1543325129138
  }
]
```

---

## **Lesson 4** - Frontend - Display Read Model Data in the Browser

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-4)

This lesson provides information on how to display a Read Model's data in the client browser. It uses the reSolve framework's **resolve-react-hooks** library to implement a frontend based on React with hooks.

> Refer to the [Frontend](frontend.md) article for information on other tools that you can use to implement a frontend.

### Implement the Client Application

> NOTE: The example code uses **react-bootstrap** to keep the markup simple. This library requires you to link the Bootstrap stylesheet file. The example project's **client/components/Header.js** file demonstrates how to link static resources to your client application.

The frontend's source files are located in the **client** folder. Create a **ShoppingLists.js** file in the **client/components** folder. In this file, implement a React component that renders a list of shopping list names:

```jsx
import React from 'react'
import { ControlLabel, Table } from 'react-bootstrap'

const ShoppingLists = ({ lists }) => {
  return (
    <div>
      <ControlLabel>My shopping lists</ControlLabel>
      <Table responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Shopping List</th>
          </tr>
        </thead>
        <tbody>
          {lists.map(({ id, name }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>{name}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default ShoppingLists
```

Add a new component named **MyLists** this component obtains shopping list data from reSolve and use the **ShoppingLists** component to display this data. To obtain the data, use the **resolve-react-hooks** library's `useQuery` hook:

```js
import React, { useState, useEffect } from 'react'

import { useQuery } from 'resolve-react-hooks'
import ShoppingLists from './ShoppingLists'

const MyLists = () => {
  const [lists, setLists] = useState({})

  // The 'useQuery' hook is used to querry the 'ShoppingLists' Read Model's 'all' resolver.
  // The obtained data is stored in the component's state.
  const getLists = useQuery(
    { name: 'ShoppingLists', resolver: 'all', args: {} },
    (error, result) => {
      // Obtain the data on the component mount.
      setLists(result)
    }
  )
  useEffect(() => {
    getLists()
  }, [])

  return (
    <div className="example-wrapper">
      <ShoppingLists lists={lists ? lists.data || [] : []} />
    </div>
  )
}

export default MyLists
```

##### Used API:

- [useQuery](api-reference.md#usequery)

Add the client application's root component that defines the HEAD section and renders routes:

```jsx
import React from 'react'
import { renderRoutes } from 'react-router-config'
import Header from './Header'

const App = ({ route, children }) => (
  <div>
    {/*Define the HEAD section and register static resources.
       See the 'client/components/Header' file for implementation details.
    */}
    <Header
      title="ReSolve Shopping List Example"
      name="Shopping List"
      css={['/bootstrap.min.css']}
    />
    {renderRoutes(route.routes)}
    {children}
  </div>
)

export default App
```

The routes are defined as follows:

```jsx
import App from './components/App'
import MyLists from './components/MyLists'

export default [
  {
    component: App,
    routes: [
      {
        path: '/',
        component: MyLists,
        exact: true
      }
    ]
  }
]
```

### Configure the Entry Point

A client entry point is a function that takes a `context` object as a parameter. You can pass this object to the resolve-react-hooks library to connect it your reSolve backend. You can implement the entry point as shown below:

```jsx
import React from 'react'
import { render } from 'react-dom'
import { ResolveContext } from 'resolve-react-hooks'
import { BrowserRouter } from 'react-router-dom'
import { renderRoutes } from 'react-router-config'

import routes from './routes'

// The 'conext' object contains data required by the 'resolve-react-hooks'.
// library to communicate with the reSolve backend.
const entryPoint = context => {
  const appContainer = document.createElement('div')
  document.body.appendChild(appContainer)
  render(
    <ResolveContext.Provider value={context}>
      <BrowserRouter>{renderRoutes(routes)}</BrowserRouter>
    </ResolveContext.Provider>,
    appContainer
  )
}

export default entryPoint
```

### Register the Entry Point

Register the client entry point in the application's configuration file as shown below:

```js
const appConfig = {
  ...
  clientEntries: ['client/index.js'],
}

export default appConfig
```

Run your application to view the result:

![result](assets/tutorial/lesson4_result.png)

---

## **Lesson 5** - Read Side - Create a View Model to Query Shopping List Items

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-5)

This lesson describes how you can use a View Model to obtain shopping list items and display them in a reactive list in the client browser.

A View Model is a reactive View Model that is built on the fly for one or several aggregate IDs. A View Model uses WebSocket to synchronize its state with the client in real time.

The downside is that a View Model does not have persistent state and should be built on every query, so it is better suited for small data samples.

### Create a Shopping List View Model

Add a **shopping_list.projection.js** file in the **common/view-models** directory. Add the following code to this file:

```js
import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

// A View Model's projection is defined in a format that is isomorphic with a Redux reducer format.
export default {
  // The 'Init' function initializes the View Model's response object.
  Init: () => ({
    id: 'id',
    name: 'unnamed',
    list: []
  }),
  // Below is a projection function. It runs on every event of the specified type, whose aggregate Id matches one of the Ids specified in the query.
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
    // A projection takes the response object and returns its updated version based on the event data.
    id: aggregateId,
    name,
    list: []
  }),
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => ({
    ...state,
    list: [
      ...state.list,
      {
        id,
        text,
        checked: false
      }
    ]
  })
}
```

Register the View Model in the application configuration file:

```js
const appConfig = {
  ...
  viewModels: [
    {
      name: 'shoppingList',
      projection: 'common/view-models/shopping_list.projection.js'
    }
  ]
}
export default appConfig
```

### Query A View Model

You can use the reSolve HTTP API to query a View Model:

```bash
$  curl -i -g -X GET "http://localhost:3000/api/query/shoppingList/shopping-list-1"
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 50
ETag: W/"32-QoPdRfMTxfncCZnYSqRYIDifC/w"
Date: Fri, 16 Nov 2018 12:10:58 GMT
Connection: keep-alive

{
  "id": "shopping-list-1",
  "name": "List 1",
  "list": [
    {
      "id": "1",
      "text": "Milk",
      "checked": false
    },
    {
      "id": "2",
      "text": "Eggs",
      "checked": false
    },
    {
      "id": "3",
      "text": "Canned beans",
      "checked": false
    },
    {
      "id": "4",
      "text": "Paper towels",
      "checked": false
    }
  ]
}
```

### Display View Model Data on the Client

Add the following React components to your client application to display shopping list items:

##### client/components/ShoppingListItem.js:

```jsx
import React from 'react'
import { ListGroupItem, Checkbox } from 'react-bootstrap'

// The layout of a single item.
const ShoppingListItem = ({ item: { id, text } }) => {
  return (
    <ListGroupItem key={id}>
      <Checkbox inline>{text}</Checkbox>
    </ListGroupItem>
  )
}

export default ShoppingListItem
```

##### client/components/ShoppingList.js:

```jsx
import React, { useState, useEffect } from 'react'
import { useViewModel } from 'resolve-react-hooks'

import {
  ListGroup,
  FormControl,
  FormGroup,
  ControlLabel
} from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'

// The shopping list populated with items obtained from the ShoppingList View Model.
const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: []
  })
  // The UseViewModel hook connects the component to a View Model
  // and reactively updates the component's state when the View Model's
  // data is updated.
  const { connect, dispose } = useViewModel(
    'shoppingList', // The View Model's name.
    [aggregateId], // The aggregate ID for which to query data.
    setShoppingList // A callback to call when new data is recieved.
  )

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div>
      <ControlLabel>Shopping list name</ControlLabel>
      <FormGroup bsSize="large">
        <FormControl type="text" value={shoppingList.name} readOnly />
      </FormGroup>
      <ListGroup>
        {shoppingList.list.map((item, idx) => (
          <ShoppingListItem key={idx} item={item} />
        ))}
      </ListGroup>
    </div>
  )
}

export default ShoppingList
```

##### Used API:

- [useViewModel](api-reference.md#useviewmodel)

### Implement Navigation

Modify the **ShoppingLists** component's layout as shown below to render links to shopping lists.

##### client/components/ShoppingLists.js:

```jsx
const ShoppingLists = ({ lists }) => {
  return (
    <div>
      ...
      <tbody>
        {lists.map(({ id, name }, index) => (
          <tr key={id}>
            <td>{index + 1}</td>
            <td>
              <Link to={`/${id}`}>{name}</Link>
            </td>
          </tr>
        ))}
      </tbody>
      ...
    </div>
  )
}
```

Run the application to see the result.

---

## **Lesson 6** - Enable Editing

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-6)

### Modify the Backend

To add data editing functionality to the Shopping List application's reSolve backend, add data editing events, modify the shopping_list aggregate to produce these events as well as read and view models to update their data based on these events.

#### Add Data Editing Events

Define events related to data editing in the **common/eventTypes.js** file.

##### common/eventTypes.js:

```js
...
export const SHOPPING_LIST_REMOVED = 'SHOPPING_LIST_REMOVED'
export const SHOPPING_ITEM_TOGGLED = 'SHOPPING_ITEM_TOGGLED'
export const SHOPPING_ITEM_REMOVED = 'SHOPPING_ITEM_REMOVED'
```

#### Modify the shopping_list Aggregate

Add the following command handlers to the shopping_list aggregate to produce the data editing events:

##### common/aggregates/shopping_lists.commands.js

```js
import {
    ...
    SHOPPING_LIST_REMOVED,
    SHOPPING_ITEM_TOGGLED,
    SHOPPING_ITEM_REMOVED,
  } from '../eventTypes'

  export default {
    ...
    removeShoppingList: (state) => {
      if (!state.createdAt) {
        throw new Error('Shopping List does not exist')
      }

      return {
        type: SHOPPING_LIST_REMOVED,
      }
    },
    toggleShoppingItem: (state, { payload: { id } }) => {
      if (!state.createdAt) {
        throw new Error('Shopping List does not exist')
      }

      if (!id) {
        throw new Error(`The "id" field is required`)
      }

      return {
        type: SHOPPING_ITEM_TOGGLED,
        payload: { id },
      }
    },
    removeShoppingItem: (state, { payload: { id } }) => {
      if (!state.createdAt) {
        throw new Error('Shopping List does not exist')
      }

      if (!id) {
        throw new Error(`The "id" field is required`)
      }

      return {
        type: SHOPPING_ITEM_REMOVED,
        payload: { id },
      }
    },
  }
```

#### Modify the shopping_lists Read Model

Define a projection function for the SHOPPING_LIST_REMOVED event in the shopping_lists Read Model's projection:

##### common/read-models/shopping_lists.projection.js

```js
import {
    ...
    SHOPPING_LIST_REMOVED,
  } from '../eventTypes'

  export default {
    ...
    [SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
      await store.delete('ShoppingLists', { id: aggregateId })
    },

  }
```

#### Modify the shopping_list View Model

In the shopping_list View Model projection, add the following projection functions:

##### common/view-models/shopping_list.projection.js

```js
import {
  ...
  SHOPPING_LIST_REMOVED,
  SHOPPING_ITEM_TOGGLED,
  SHOPPING_ITEM_REMOVED,
} from '../eventTypes'

export default {
  ...
  [SHOPPING_LIST_REMOVED]: () => ({
    removed: true,
  }),
  [SHOPPING_ITEM_TOGGLED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.map((item) =>
      item.id === id
        ? {
            ...item,
            checked: !item.checked,
          }
        : item
    ),
  }),
  [SHOPPING_ITEM_REMOVED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.filter((item) => item.id !== id),
  }),
}
```

### Modify the Frontend

Add a React component to create new shopping lists:

##### client/components/ShoppingListCreator.js

```jsx
import React, { useState } from 'react'
import { Button, Col, ControlLabel, FormControl, Row } from 'react-bootstrap'
import { useCommand } from 'resolve-react-hooks'
import uuid from 'uuid/v4'

const ShoppingListCreator = ({ lists, onCreateSuccess }) => {
  const [shoppingListName, setShoppingListName] = useState('')

  // The useCommandHook allows you send commands to reSolve.
  const createShoppingListCommand = useCommand(
    {
      type: 'createShoppingList',
      aggregateId: uuid(),
      aggregateName: 'ShoppingList',
      payload: {
        name: shoppingListName || `Shopping List ${lists.length + 1}`
      }
    },
    (err, result) => {
      setShoppingListName('')
      onCreateSuccess(err, result)
    }
  )

  const updateShoppingListName = event => {
    setShoppingListName(event.target.value)
  }

  const onShoppingListNamePressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingListCommand()
    }
  }

  return (
    <div>
      <ControlLabel>Shopping list name</ControlLabel>
      <Row>
        <Col md={8}>
          <FormControl
            type="text"
            value={shoppingListName}
            onChange={updateShoppingListName}
            onKeyPress={onShoppingListNamePressEnter}
          />
        </Col>
        <Col md={4}>
          <Button bsStyle="success" onClick={createShoppingListCommand}>
            Add Shopping List
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingListCreator
```

##### Used API:

- [useCommand](api-reference.md#usecommand)

You can render this component within MyLists as shown below:

##### client/components/MyLists.js

```jsx
const MyLists = () => {
  ...
  return (
    <div className="example-wrapper">
      ...
      <ShoppingListCreator
        lists={lists ? lists.data || [] : []}
        onCreateSuccess={(err, result) => {
          const nextLists = { ...lists }
          nextLists.data.push({
            name: result.payload.name,
            createdAt: result.timestamp,
            id: result.aggregateId,
          })
          setLists(nextLists)
        }}
      />
    </div>
  )
}
```

The following component implements a **Delete** button for a shopping list:

##### client/components/ShoppingListRemover.js

```jsx
import React from 'react'
import { Button } from 'react-bootstrap'
import { useCommand } from 'resolve-react-hooks'

const ShoppingListRemover = ({ shoppingListId, onRemoveSuccess }) => {
  // A command to remove the list
  const removeShoppingListCommand = useCommand(
    {
      type: 'removeShoppingList',
      aggregateId: shoppingListId,
      aggregateName: 'ShoppingList'
    },
    onRemoveSuccess
  )

  return <Button onClick={removeShoppingListCommand}>Delete</Button>
}

export default ShoppingListRemover
```

##### Used API:

- [useCommand](api-reference.md#usecommand)

Add this component each item in the ShoppingLists component's layout:

##### client/components/ShoppingLists.js

```jsx
const ShoppingLists = ({ lists, onRemoveSuccess }) => {
  return (
    <div>
        ...
        <tbody>
          {lists.map(({ id, name }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>
                <Link to={`/${id}`}>{name}</Link>
              </td>
              <td>
                <ShoppingListRemover
                  shoppingListId={id}
                  onRemoveSuccess={onRemoveSuccess}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default ShoppingLists
```

Also add an `onRemoveSuccess` handler to MyLists:

##### client/components/MyLists.js

```jsx
const MyLists = () => {
  ...
  return (
    <div className="example-wrapper">
      <ShoppingLists
        lists={lists ? lists.data || [] : []}
        onRemoveSuccess={(err, result) => {
          setLists({
          ...lists,
          data: lists.data.filter((list) => list.id !== result.aggregateId),
         })
      }}
      />
      ...
    </div>
  )
}
```

The code below demonstrates how to implement data editing for the ShoppingList component:

##### client/components/ShoppingList.js

```jsx
import React, { useState, useEffect } from 'react'
import { useCommandBuilder, useViewModel } from 'resolve-react-hooks'

import {
  Row,
  Col,
  ListGroup,
  Button,
  InputGroup,
  FormControl,
  FormGroup,
  ControlLabel
} from 'react-bootstrap'

import ShoppingListItem from './ShoppingListItem'

const ShoppingList = ({
  match: {
    params: { id: aggregateId }
  }
}) => {
  const [shoppingList, setShoppingList] = useState({
    name: '',
    id: null,
    list: []
  })
  const { connect, dispose } = useViewModel(
    'shoppingList',
    [aggregateId],
    setShoppingList
  )
  const [itemText, setItemText] = useState('')
  const clearItemText = () => setItemText('')

  // The useCommandBuilder hook creates a function that generates commands based on a parameter
  const createShoppingItem = useCommandBuilder(
    text => ({
      type: 'createShoppingItem',
      aggregateId,
      aggregateName: 'ShoppingList',
      payload: {
        text,
        id: Date.now().toString()
      }
    }),
    clearItemText
  )

  const updateItemText = event => {
    setItemText(event.target.value)
  }
  const onItemTextPressEnter = event => {
    if (event.charCode === 13) {
      event.preventDefault()
      createShoppingItem(itemText)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      dispose()
    }
  }, [])

  return (
    <div>
      <ControlLabel>Shopping list name</ControlLabel>
      <FormGroup bsSize="large">
        <FormControl type="text" value={shoppingList.name} readOnly />
      </FormGroup>
      <ListGroup>
        {shoppingList.list.map((item, idx) => (
          <ShoppingListItem
            shoppingListId={aggregateId}
            key={idx}
            item={item}
          />
        ))}
      </ListGroup>
      <ControlLabel>Item name</ControlLabel>
      <Row>
        <Col md={8}>
          <FormControl
            type="text"
            value={itemText}
            onChange={updateItemText}
            onKeyPress={onItemTextPressEnter}
          />
        </Col>
        <Col md={4}>
          <Button
            bsStyle="success"
            onClick={() => createShoppingItem(itemText)}
          >
            Add Item
          </Button>
        </Col>
      </Row>
    </div>
  )
}

export default ShoppingList
```

##### Used API:

- [useCommandBuilder](api-reference.md#usecommandbuilder)
- [useViewModel](api-reference.md#useviewmodel)

Modify the ShoppingListItem component to support item checking and deletion.

##### client/components/ShoppingListItem.js

```jsx
import React from 'react'
import { ListGroupItem, Checkbox, Button, Clearfix } from 'react-bootstrap'
import { useCommand } from 'resolve-react-hooks'

const ShoppingListItem = ({ shoppingListId, item: { id, checked, text } }) => {
  const toggleItem = useCommand({
    type: 'toggleShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id
    }
  })
  const removeItem = useCommand({
    type: 'removeShoppingItem',
    aggregateId: shoppingListId,
    aggregateName: 'ShoppingList',
    payload: {
      id
    }
  })
  return (
    <ListGroupItem key={id}>
      <Clearfix>
        <Checkbox inline checked={checked} onChange={toggleItem}>
          {text}
        </Checkbox>
        <Button onClick={removeItem} className="pull-right">
          Delete
        </Button>
      </Clearfix>
    </ListGroupItem>
  )
}

export default ShoppingListItem
```

##### Used API:

- [useCommand](api-reference.md#usecommand)

Run the application to view the result.
