# Lesson 7 - Functionality Enhancements

In this lesson, you will provide miscellaneous functionality enhancements to your Shopping List application in order to support the full set of data editing operations. These steps are not essential, but they will help you to further deepen your understanding of the reSolve framework's fundamentals.

### Modify the Write Side

Define events to provide the missing functionality:

```js
...
export const SHOPPING_LIST_RENAMED = 'SHOPPING_LIST_RENAMED'

export const SHOPPING_LIST_REMOVED = 'SHOPPING_LIST_REMOVED'

export const SHOPPING_ITEM_REMOVED = 'SHOPPING_ITEM_REMOVED'
```

Modify the shopping list projection to account for removing shopping lists:

```js
[SHOPPING_LIST_REMOVED]: () => ({})
```

Define command handlers to provide the data editing functionality.

```js
...

  renameShoppingList: (state, { payload: { name } }) => {
    return {
      type: SHOPPING_LIST_RENAMED,
      payload: { name }
    }
  },

  removeShoppingList: state => {
    return {
      type: SHOPPING_LIST_REMOVED
    }
  },

  removeShoppingItem: (state, { payload: { id } }) => {
    return {
      type: SHOPPING_ITEM_REMOVED,
      payload: { id }
    }
  }
```

### Modify the Read Side

Modify the ShoppingList View Model to account for the new functionality:

```js
...

  [SHOPPING_LIST_RENAMED]: (state, { payload: { name } }) => ({
    ...state,
    name
  }),

  [SHOPPING_LIST_REMOVED]: () => ({
    removed: true
  }),

  [SHOPPING_ITEM_REMOVED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.filter(item => item.id !== id)
  })
```

Modify the ShoppingLists Read Model projection:

```js
...

  [SHOPPING_LIST_REMOVED]: async (store, { aggregateId }) => {
    await store.delete('ShoppingLists', { id: aggregateId })
  },

  [SHOPPING_LIST_RENAMED]: async (
    store,
    { aggregateId, payload: { name } }
  ) => {
    await store.update('ShoppingLists', { id: aggregateId }, { $set: { name } })
  }
```

### Modify the Frontend
