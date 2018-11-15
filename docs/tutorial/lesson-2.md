# Lesson 2 - Write side - Add a list item

This lesson will teach you how to implement a basic write side for your reSolve application. An application's write side is responsible for handling commands, performing input validation and emitting **events** based on valid commands. The emitted events are then saved to the **event store**.

In CQRS and Event Sourcing paradigms, commands are handled by Domain Objects, which are grouped into aggregates. ReSolve implements aggregates as static objects containing sets of functions. These functions can of one of the following two kinds:

- **Command Handlers** - Handle commands and emit events in response.
- **Projections** - Build aggregate state from events so this state can be observed on the write side, for example to perform input validation.

### Creating an Aggregate

Use the following steps to implement the write side for your shopping list application.

To add an aggregate to you shopping list application, first define types of events that this aggregate will produce. Create an **eventTypes.js** file in the project's **common** folder and add the following content to it.

**common/eventTypes.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-2/common/eventTypes.js /^/ /\n$/)
```js
export const SHOPPING_ITEM_CREATED = 'SHOPPING_ITEM_CREATED'
```
<!-- prettier-ignore-end -->

For now, your application requires only one type of events - an event signaling about creation of a shopping list item.

Next, create a **shopping_list.commands.js** file in the **aggregates** folder. This file will contain command handlers for the ShoppingList aggregate. Add the following code to the file:

```js
import { SHOPPING_ITEM_CREATED } from '../eventTypes'
import validation from './validation'

export default {
  createShoppingItem: (state, { payload: { text } }) => {
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { text }
    }
}
```

As you can see, the file exports an object containing a single **createShoppingItem** event handler. The event handler receives the aggregate state and a commands payload. A payload can contain any arbitrary data related to the command. For the createShoppingItem command the payload only contains the list item text.

As the result of its execution, a command handler returns an event object. This object contains an obligatory **type** field defining the event's type and the **payload** field containing data associated with the event. In case of the **SHOPPING_ITEM_CREATED** event, the event payload contains the same item text that is obtained from the command's payload. The reSolve framework saves events returned by command handlers to a persistent **event store**. For now, your application is configured to use a file-based event store, which is sufficient for learning purposes. Later on, you will learn how to use different kinds of stores using **storage adapters**.

Your minimal shopping list aggregate is now ready. The last step is to register it in the application's configuration file. Open the **config.app.js** file, locate the **aggregates** section and specify the following settings:

```js
aggregates: [
  {
    name: 'ShoppingList',
    commands: 'common/aggregates/shopping_list.commands.js',
  }
],
```

Here, you just specify the aggregate name and the path to the file containing the aggregate's command handlers.

### Sending a Command

### Performing Validation
