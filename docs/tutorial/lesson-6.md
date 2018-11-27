# Lesson 6 - Frontend - Support Multiple Shopping Lists

In the previous two lessons you have been implementing the client-side UI for viewing and editing items in a shopping list. However, you may have noticed that your application's functionality is incomplete: it is possible use HTTP API to create multiple shopping lists, but the client UI only allows viewing and editing only one specific list.

In this lesson, you will enhance your application's functionality with the capability to create multiple shopping lists and navigate between them using the client UI.

### Implement a Shopping Lists Read Model

In the Lesson 3, you have implemented a View Model used to obtain information about shopping lists with the specified aggregate ID's.

Although it is possible to use a View Model for obtaining available shopping lists, there is a strong reason not to do so.

Consider a situation, in which your application has been running in a production environment for a long time and a large number of shopping lists has been created. If you used a View Model to answer queries, a resulting data sample would be generated on the fly for every requests using events from the beginning of the history. Note that it is not a problem when you use a View Model to obtain a single list's items as the item count is always considerably small.

To overcome this issue, implement a ShoppingLists Read Model. This Read Model will gradually accumulate its state based on incoming events and store this state in the Read Model Storage. This part of the functionality is implemented by the Red Model **projection**:

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

You also need to implement resolver functions that will answer queries using the accumulated data.

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

Note that regular Read Models are not reactive like View Models are. This will have a side effect, which will be discussed in greater detail later in this lesson.

### Query a Read Model Through HTTP API

### Implement Client UI

### Enable Data Editing

### Support Optimistic UI Updates
