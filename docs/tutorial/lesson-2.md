# Lesson 2 - Write side - Add a List Item

This lesson will teach you how to implement a basic write side for your reSolve application. An application's write side is responsible for handling commands, performing input validation and emitting **events** based on valid commands. The emitted events are then saved to the **event store**.

In CQRS and Event Sourcing paradigms, commands are handled by Domain Objects, which are grouped into aggregates. ReSolve implements aggregates as static objects containing sets of functions. These functions can of one of the following two kinds:

- **Command Handlers** - Handle commands and emit events in response.
- **Projections** - Build aggregate state from events so this state can be observed on the write side, for example to perform input validation.

### Creating an Aggregate

Use the following steps to implement the write side for your shopping list application.

To add an aggregate to you shopping list application, first define types of events that this aggregate will produce. Create an **eventTypes.js** file in the project's **common** folder and add the following content to it.

**[common/eventTypes.js:](../../examples/shopping-list-tutorial/lesson-2/common/eventTypes.js)**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-2/common/eventTypes.js /^/ /\n$/)
```js
export const SHOPPING_LIST_CREATED = "SHOPPING_LIST_CREATED";

export const SHOPPING_ITEM_CREATED = "SHOPPING_ITEM_CREATED";
```
<!-- prettier-ignore-end -->

For now, your application requires only two types of events:

- The SHOPPING_LIST_CREATED event signals about creation of a shopping list.
- The SHOPPING_ITEM_CREATED event signals about creation of an item within a shopping list.

Next, create a **shopping_list.commands.js** file in the **common/aggregates** folder. This file will contain command handlers for the ShoppingList aggregate. Add the following code to the file:

**[common/aggregates/shopping_list.commands.js:](../../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.commands.js)**

```js
import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from '../eventTypes'

export default {
  createShoppingList: (state, { payload: { name } }) => {
    return {
      type: SHOPPING_LIST_CREATED,
      payload: { name }
    }
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    return {
      type: SHOPPING_ITEM_CREATED,
      payload: { id, text }
    }
  }
}
```

As you can see, the file exports an object containing two command handlers. A command handler receives the aggregate state and a commands payload. A payload can contain any arbitrary data related to the command. For example, the **createShoppingList** command's payload contains a shopping list name, and the **createShoppingItem** command payload contains an item's ID and displayed text.

As the result of its execution, a command handler returns an event object. This object contains an obligatory **type** field defining the event's type and the **payload** field containing data associated with the event. In the example code, the event payloads contain the same field that were obtained from the command payloads. The reSolve framework saves events returned by command handlers to a persistent **event store**. For now, your application is configured to use a file-based event store, which is sufficient for learning purposes. Later on, you will learn how to use different kinds of stores using **storage adapters**.

Your minimal shopping list aggregate is now ready. The last step is to register it in the application's configuration file. Open the **config.app.js** file, locate the **aggregates** section and specify the following settings:

**[config.app.js:](../../examples/shopping-list-tutorial/lesson-2/config.app.js)**

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

### Sending Commands to an Aggregate

Now that your application is capable of handling commands, you can try sending such commands to create a shopping list and populate it with items.

ReSolve framework provides a standard API that allows you to send commands to an application's aggregate using HTTP requests.

The request body should have the `application/json` content type and contain a JSON representation of the command:

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

In addition to the aggregate name, command type and payload, this object specifies the aggregate Id (a unique identifier of an aggregate instance).

Run your application and send a POST request to the following URL:

```
http://127.0.0.1:3000/api/commands
```

You can do this using any REST client or using **curl**. For example, use the following inputs to create a shopping list:

```sh
$ curl -i http://localhost:3000/api/commands/ \
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

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 11:47:53 GMT
Connection: keep-alive

OK
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

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 2
ETag: W/"2-nOO9QiTIwXgNtWtBJezz8kv3SLc"
Date: Tue, 02 Oct 2018 12:13:39 GMT
Connection: keep-alive

OK
```

Add several more items to have data to work with in future lessons.

Now, you can check the event store file to see the newly created event. Open the **event-storage.db** file and locate the created event objects:

<!-- prettier-ignore-start -->
``` json
{"type":"SHOPPING_LIST_CREATED","payload":{"name":"List 1"},"aggregateId":"shopping-list-1","aggregateVersion":1,"timestamp":1542884752421,"aggregateIdAndVersion":"shopping-list-1:1","_id":"Ujiz4pjVwid1AaZP"}
{"type":"SHOPPING_ITEM_CREATED","payload":{"id":"1","text":"Milk"},"aggregateId":"shopping-list-1","aggregateVersion":2,"timestamp":1542884835201,"aggregateIdAndVersion":"shopping-list-1:2","_id":"RBr1596unUVhTJeo"}
{"type":"SHOPPING_ITEM_CREATED","payload":{"id":"2","text":"Eggs"},"aggregateId":"shopping-list-1","aggregateVersion":3,"timestamp":1542884852629,"aggregateIdAndVersion":"shopping-list-1:3","_id":"WJfG65khmyoPY12U"}
{"type":"SHOPPING_ITEM_CREATED","payload":{"id":"3","text":"Canned beans"},"aggregateId":"shopping-list-1","aggregateVersion":4,"timestamp":1542884875144,"aggregateIdAndVersion":"shopping-list-1:4","_id":"qvKCvnEOhVQrD7xJ"}
{"type":"SHOPPING_ITEM_CREATED","payload":{"id":"4","text":"Paper towels"},"aggregateId":"shopping-list-1","aggregateVersion":5,"timestamp":1542884890484,"aggregateIdAndVersion":"shopping-list-1:5","_id":"YEnzkAlBjEqaLwQI"}

```
<!-- prettier-ignore-end -->

### Performing Validation

Your application currently has a flaw - it does not perform any input validation. This results in the following flaws:

- The aggregate allows you to create shopping lists and items without specifying the required fields in the payload.
- It is possible to create more then one shopping list with the same aggregate ID.
- You can create items for a shopping list that does not exist.

You can overcome the first flaw by adding simple checks to each command handler:

**[common/aggregates/shopping_list.commands.js:](../../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.commands.js)**

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

To overcome the second and third flaws, you need to somehow store information about previously performed operations. You can achieve this by maintaining an **aggregate state**. This state is assembled on the fly by an aggregate **projection** from previously created events. To add a projection to the ShoppingList aggregate, create a **shopping_list.projection.js** file in the **common/aggregates** folder and add the following code there:

**[common/aggregates/shopping_list.projection.js:](../../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.projection.js)**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.projection.js /^/ /\n$/)
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

Register the create projection in the application configuration file:

**[config.app.js:](../../examples/shopping-list-tutorial/lesson-2/config.app.js)**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-2/config.app.js /^[[:blank:]]+aggregates:/ /\],/)
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

The projection object should specify an obligatory **Init** function and a set of **projection functions**.

- The Init function initializes the aggregate state. In the example code, it creates a new empty object.
- Projection functions build the aggregate state based on the aggregate's events. Each such function is associated with a particular event type. The function receives the previous state and an event, and returns a new state based on the input.

In the example code, the SHOPPING_LIST_CREATED projection function adds the SHOPPING_LIST_CREATED event's timestamp to the state. This information can be used on the write side to figure out whether and when a shopping list has been created for the current aggregate instance (i.e., an instance identified by the current aggregate ID).

**[common/aggregates/shopping_list.commands.js:](../../examples/shopping-list-tutorial/lesson-2/common/aggregates/shopping_list.commands.js)**

```js
  createShoppingList: (state, { payload: { name } }) => {
    if (state.createdAt) throw new Error("shopping List already exists");
    ...
  },
  createShoppingItem: (state, { payload: { id, text } }) => {
    if (!state || Object.keys(state).length === 0) {
      throw new Error(`shopping list does not exist`);
    }
    ...
  }
```

You can check whether or not the validation works as intended by sending commands to your aggregate:

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


# Trying to create an shopping list that already exists
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

Command error: shopping list already exists


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

Command error: shopping list does not exist
```
