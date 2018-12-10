---
id: lesson-6
title: Lesson 6 - Frontend - Support Multiple Shopping Lists
---

# Lesson 6 - Frontend - Support Multiple Shopping Lists

In the previous two lessons, you have been implementing the client-side UI for viewing and editing items in a shopping list. However, you may have noticed that your application's functionality is incomplete: it is possible use HTTP API to create multiple shopping lists, but the client UI only allows viewing and editing only one specific list, namely **shopping-list-1**:

**[client/containers/ShoppingList.js:](../../examples/shopping-list-tutorial/lesson-6/client/containers/ShoppingList.js)**

```jsx
export const mapStateToOptions = (state, ownProps) => {
  return {
    viewModelName: 'ShoppingList',
    aggregateIds: ['shopping-list-1']
  }
}
```

In this lesson, you will enhance your application's functionality with the capability to create multiple shopping lists, navigate between these lists and add items to them using the client UI.

### Implement a Shopping Lists Read Model

In the [Lesson 3](lesson-3.md), you have implemented a View Model used to obtain information about shopping lists with the specified aggregate ID's. Although it is possible to use the same approach for obtaining the list of all available shopping lists, there is a strong reason not to do so.

Consider a situation, in which your application has been running in a production environment for a long time and a large number of shopping lists has been created. If you used a View Model to answer queries, a resulting data sample would be generated on the fly for every requests using events from the beginning of the history, which will result in a huge performance overhead on _each request_. Note that it is not a problem when you use a View Model to obtain a single list's items as the item count is always considerably small.

To overcome this issue, implement a ShoppingLists **[Read Model](../basics/read-side.md#read-models)**. This Read Model will gradually accumulate its state based on incoming events and store this state in the Read Model Storage. This part of the functionality is implemented by the Red Model **[projection](../basics/read-side.md)**:

**[common/read-models/shopping_lists.projection.js:](../../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.projection.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.projection.js /^/   /\n$/)
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

<!-- prettier-ignore-end -->

You also need to implement **[resolver functions](../basics/read-side.md#resolvers)** that will answer queries using the accumulated data.

**[common/read-models/shopping_lists.resolvers.js:](../../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.resolvers.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.resolvers.js /^/   /\n$/)
```js
export default {
  all: async store => {
    return await store.find('ShoppingLists', {}, null, { createdAt: 1 })
  }
}
```

<!-- prettier-ignore-end -->

In this example, the **all** resolver function is used to obtain all available shopping lists.

Register the created Read Model in the application's configuration file:

**[config.app.js:](../../examples/shopping-list-tutorial/lesson-6/config.app.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/config.app.js /^[[:blank:]]+readModels:/ /\],/)
```js
  readModels: [
    {
      name: 'ShoppingLists',
      projection: 'common/read-models/shopping_lists.projection.js',
      resolvers: 'common/read-models/shopping_lists.resolvers.js'
    }
  ],
```

<!-- prettier-ignore-end -->

Note that regular Read Models are not reactive like View Models are. This results in several side effects, that will be discussed in greater detail later in this lesson.

### Query a Read Model Through HTTP API

You can test the ShoppingLists Read Model's functionality using the standard HTTP API:

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

### Implement Client UI

Now you can implement the UI to display all available shopping list an provide and create new shopping lists.

**[client/containers/MyLists.js:](../../examples/shopping-list-tutorial/lesson-6/client/containers/MyLists.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/client/containers/MyLists.js /class MyLists/ /^}/)
```js
class MyLists extends React.PureComponent {
  render() {
    const { lists, createShoppingList } = this.props
    return (
      <div style={{ maxWidth: '500px', margin: 'auto' }}>
        <ShoppingLists lists={lists} />
        <ShoppingListCreator
          lists={lists}
          createShoppingList={createShoppingList}
        />
      </div>
    )
  }
}
```

<!-- prettier-ignore-end -->

See the [shoppingLists](../../examples/shopping-list-tutorial/lesson-6/client/components/ShoppingLists.js) and [shoppingListsCreator](../../examples/shopping-list-tutorial/lesson-6/client/components/ShoppingListCreator.js) files to see the details of these components' implementation.

The implemented container component is bound to the ShoppingLists Read Model as shown below:

**[client/containers/MyLists.js:](../../examples/shopping-list-tutorial/lesson-6/client/containers/MyLists.js)**

```js
export const mapStateToOptions = () => ({
  readModelName: 'ShoppingLists',
  resolverName: 'all',
  resolverArgs: {}
})

export const mapStateToProps = (state, ownProps) => ({
  lists: ownProps.data
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(MyLists)
)
```

Now that your application has two main views, you need to provide means of navigation between them. To achieve this goal, you need to configure the react router.

**[client/routes.js:](../../examples/shopping-list-tutorial/lesson-6/client/routes.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/client/routes.js /^/ /\n$/)
```js
import App from './containers/App'
import ShoppingList from './containers/ShoppingList'
import MyLists from './containers/MyLists'

export default [
  {
    component: App,
    routes: [
      {
        path: '/',
        component: MyLists,
        exact: true
      },
      {
        path: '/:id',
        component: ShoppingList
      }
    ]
  }
]
```

<!-- prettier-ignore-end -->

Next, modify the **App** component to use the router.

**[client/containers/App.js:](../../examples/shopping-list-tutorial/lesson-6/client/containers/App.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/client/containers/App.js /^/ /\n$/)
```js
import React from 'react'

import Header from './Header.js'
import ShoppingList from './ShoppingList'

const App = ({
  children,
  match: {
    params: { id }
  }
}) => (
  <div>
    <Header
      title="reSolve Shopping List"
      name="Shopping List"
      favicon="/favicon.ico"
      css={['/bootstrap.min.css']}
    />
    {children}
  </div>
)

export default App
```

<!-- prettier-ignore-end -->

Also, modify the **ShoppingList** component so it obtains the list aggregate ID from the **:id** route parameter and displays proper items.

**[client/containers/ShoppingList.js:](../../examples/shopping-list-tutorial/lesson-6/client/containers/ShoppingList.js)**

```jsx
export const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    viewModelName: 'ShoppingList',
    aggregateIds: [aggregateId]
  }
}

export const mapStateToProps = (state, ownProps) => {
  const aggregateId = ownProps.match.params.id

  return {
    aggregateId
  }
}
```

For now, binding a component to a reSolve Read Model looks similar to how you bound the ShoppingList component to a View Model in the [Lesson 4](lesson-4.md). Run, your application and try adding a new shopping list using the implemented UI.

You should have noticed that although you application correctly sends commands to the backend, the client UI does not reflect the change in the application state. A newly created shopping list only appears after you refresh the page. This is an expected behavior because Read Models are not reactive by default. This means that components connected to Read Models do not automatically synchronize their Redux state with the Read Model state on the server.

You can overcome this limitation by introducing optimistic UI updates as the next section describes.

### Support Optimistic UI Updates

With the optimistic UI updating approach, a component applies model changes to the client Redux state before sending them to the server using an aggregate command. Follow the steps below to provide such functionality.

First, define Redux actions that will perform updates:

**[client/actions/optimistic_actions.js:](../../examples/shopping-list-tutorial/lesson-6/client/actions/optimistic_actions.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/client/actions/optimistic_actions.js /^/ /\n$/)
```js
export const OPTIMISTIC_CREATE_SHOPPING_LIST = 'OPTIMISTIC_CREATE_SHOPPING_LIST'
export const OPTIMISTIC_SYNC = 'OPTIMISTIC_SYNC'
```

<!-- prettier-ignore-end -->

Implement an optimistic reducer function that responds to these commands to update the corresponding slice of the Redux state:

**[client/reducers/optimistic_shopping_lists.js:](../../examples/shopping-list-tutorial/lesson-6/client/reducers/optimistic_shopping_lists.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/client/reducers/optimistic_shopping_lists.js /^/ /\n$/)
```js
import { LOCATION_CHANGE } from 'react-router-redux'
import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const optimistic_shopping_lists = (state = [], action) => {
  switch (action.type) {
    case LOCATION_CHANGE: {
      return []
    }
    case OPTIMISTIC_CREATE_SHOPPING_LIST: {
      return [
        ...state,
        {
          id: action.payload.id,
          name: action.payload.name
        }
      ]
    }
    case OPTIMISTIC_SYNC: {
      return action.payload.originalLists
    }
    default: {
      return state
    }
  }
}

export default optimistic_shopping_lists
```

<!-- prettier-ignore-end -->

Provide a middleware that intercepts the service actions used for communication between between Redux and reSolve:

**[client/reducers/optimistic_shopping_lists_middleware.js:](../../examples/shopping-list-tutorial/lesson-6/client/middlewares/optimistic_shopping_lists_middleware.js)**

<!-- prettier-ignore-start -->

[embedmd]:# (../../examples/shopping-list-tutorial/lesson-6/client/middlewares/optimistic_shopping_lists_middleware.js /^/ /\n$/)
```js
import { actionTypes } from 'resolve-redux'

import {
  OPTIMISTIC_CREATE_SHOPPING_LIST,
  OPTIMISTIC_SYNC
} from '../actions/optimistic_actions'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

const optimistic_shopping_lists_middleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_CREATE_SHOPPING_LIST,
      payload: {
        id: action.aggregateId,
        name: action.payload.name
      }
    })
  }
  if (action.type === LOAD_READMODEL_STATE_SUCCESS) {
    store.dispatch({
      type: OPTIMISTIC_SYNC,
      payload: {
        originalLists: action.result
      }
    })
  }

  next(action)
}

export default optimistic_shopping_lists_middleware
```

<!-- prettier-ignore-end -->

Modify the **mapStateToProps** function implementation for the MyLists component so that component props are bound to the implemented slice of the Redux state:

```jsx
export const mapStateToProps = (state, ownProps) => ({
  lists: state.optimisticShoppingLists || []
})
```

Now, if you run your application and create a new shopping list, the created shopping list will be displayed immediately.
