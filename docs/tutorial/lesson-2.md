# Lesson 2 - Write side - Add a List Item

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

**common/aggregates/shopping_list.commands.js:**

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

Here, you just specify the aggregate name and the path to the file containing the aggregate's command handlers.

### Sending a Command

Now that your application is capable of handling item creation commands, you can try sending such command.

ReSolve framework provides a standard API that allows you to send a command to an application's aggregate using a HTTP request.

The request body should have the `application/json` content type and contain a JSON representation of the command:

```
{
  "aggregateName": "ShoppingList",
  "type": "createShoppingItem",
  "aggregateId": "root-id",
  "payload": {
    "text": "Item 1"
  }
}
```

In addition to aggregate name, command type and payload, this object specifies the aggregate Id (a unique identifier of an aggregate instance). Currently, your application requires a single aggregate instance that handles commands for a single shopping list, so you can use an ID of your choice ("root-id" in the provided sample).

Run your application and send a POST request to the following URL:

```
http://127.0.0.1:3000/api/commands
```

You can do this using any REST client or using **curl**, as shown below:

```sh
$ curl -i http://localhost:3000/api/commands/ \
--header "Content-Type: application/json" \
--data '
{
    "aggregateName": "ShoppingList",
    "aggregateId": "root-id",
    "type": "createShoppingItem",
    "payload": {
        "text": "Item 1"
    }
}
'

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 11:47:53 GMT
Connection: keep-alive

OK
```

Now, you can check the event store file to see the newly created event. Open the **event-storage.db** file and locate the event object:

<!-- prettier-ignore-start -->
``` json
{"type":"SHOPPING_ITEM_CREATED","payload":{"text":"Item 1"},"aggregateId":"root-id","aggregateVersion":1,"timestamp":1542290836877,"aggregateIdAndVersion":"root-id:1","_id":"Qt5KvZEBpeivbm9N"}
```
<!-- prettier-ignore-end -->

### Performing Validation

Your application currently has a flaw - it allows submitting list item creation command without the item text in the payload. You can prevent creating such items by performing input validation in the command handler code.

First, implement the required validation function. Add a **validation.js** file in the project's **aggregates** folder and add the following code to it:

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-2/common/aggregates/validation.js /^/ /\n$/)
```js
export default {
  fieldRequired: (payload, field) => {
    if (!payload[field]) {
      throw new Error(`The "${field}" field is required`)
    }
  }
}
```
<!-- prettier-ignore-end -->

All this code does is checking the existence of a certain field in the payload and throwing an error if the field does not exist.

Now you can use this function to check whether or not the **text** field exists in the payload. To achieve this, add the following code to the **fieldRequired** command handler implementation:

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.commands.js /export default/ /^\}/)
```js
export default {
  createShoppingItem: (state, { payload: { text } }) => {
    validation.fieldRequired({ text }, 'text')
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { text }
    }
  }
}
```
<!-- prettier-ignore-end -->
