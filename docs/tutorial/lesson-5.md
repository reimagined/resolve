# Lesson 5 - Frontend - Enable Data Editing


### Modify Backend Functionality
Your applcation already implements logic required to add new list items. Apply the following modfications to the server code to also support item checking:

1. Add a new event type that signals about the item checkbox being toggled.

**common/eventTypes.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-5/common/eventTypes.js /export const SHOPPING_ITEM_TOGGLED/ /\n$/)
```js
export const SHOPPING_ITEM_TOGGLED = 'SHOPPING_ITEM_TOGGLED'
```
<!-- prettier-ignore-end -->



2. Add an **id** field to the payload of the **createShoppingItem** comand and **SHOPPING_ITEM_CREATED** event. This field's value uniquely identifies a list item.

**common/aggregates/shopping_list.commands.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-5/common/aggregates/shopping_list.commands.js /createShoppingItem/   /^[[:blank:]]+\},/)
```js
createShoppingItem: (state, { payload: { id, text } }) => {
    validation.fieldRequired({ text }, 'text')
    validation.fieldRequired({ id }, 'id')
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    }
  },
```
<!-- prettier-ignore-end -->


3. Add a command handler that produces the added event in responce to the **toggleShoppingItem** command.

**common/aggregates/shopping_list.commands.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-5/common/aggregates/shopping_list.commands.js /toggleShoppingItem/   /^[[:blank:]]{2}\}/)
```js
toggleShoppingItem: (state, { payload: { id } }) => {
    validation.fieldRequired({ id }, 'id')
    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id }
    }
  }
```
<!-- prettier-ignore-end -->

The event payload contains the toggled item's identifier.

4. Modify the **ShoppingList** View Model projection code so that the response data sample includes the ID payload field.

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-5/common/view-models/shopping_list.projection.js /\[SHOPPING_ITEM_CREATED\]/   /\},/)
```js
[SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => {
    return [...state, { id, text }]
  },
```
<!-- prettier-ignore-end -->


5. To the same projection, add code that applies **SHOPPING_ITEM_TOGGLED** events to the data sample.

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-5/common/view-models/shopping_list.projection.js /\[SHOPPING_ITEM_TOGGLED\]/   /^[[:blank:]]+\]/)
```js
[SHOPPING_ITEM_TOGGLED]: (state, { payload: { id } }) => [
    ...state.map(
      item =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked
            }
          : item
    )
  ]
```
<!-- prettier-ignore-end -->
