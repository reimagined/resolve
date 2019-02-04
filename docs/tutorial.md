---
id: tutorial
title: Step-by-Step Tutorial
---

This document provides a step-by-step tutorial for the reSolve framework.
Throughout this tutorial, you will be creating a single application. You will modify your application as you learn new concepts, so with every consequent lesson the application will become more and more sophisticated.

This tutorial will give you an understanding of the reSolve framework and its fundamental concepts. It is recommended that your familiarize yourself with event sourcing and CQRS before starting this tutorial, however it is not strictly required.

## Table of Contents

- [Lesson 1 - Create a New reSolve Application](#lesson-1-create-a-new-resolve-application)
- [Lesson 2 - Write side - Add a List Item](#lesson-2-write-side-add-a-list-item)
- [Lesson 3 - Read side - Create a View Model to Query List Items](#lesson-3-read-side-create-a-view-model-to-query-list-items)
- [Lesson 4 - Frontend - Display View Model Data in the Browser](#lesson-4-frontend-display-view-model-data-in-the-browser)
- [Lesson 5 - Frontend - Enable Data Editing](#lesson-5-frontend-enable-data-editing)
- [Lesson 6 - Frontend - Support Multiple Shopping Lists](#lesson-6-frontend-support-multiple-shopping-lists)
- [Lesson 7 - Functionality Enhancements](#lesson-7-functionality-enhancements)

---

## **Lesson 1** - Create a New reSolve Application

Use the create-resolve-app utility available on **npm** to create a new reSolve app:

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

After this, a minimal reSolve application is ready. You can run it in development mode by typing:

```sh
$ cd shopping-list
$ yarn run dev
```

---

## **Lesson 2** - Write side - Add a List Item

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-2)

This lesson will teach you how to implement a basic write side for your reSolve application. An application's [write side](resolve-app-structure.md#write-and-read-sides) handles commands, performs input validation and emits **events** based on valid commands. The framework then saves the emitted events to the **event store**.

In the CQRS and Event Sourcing paradigms, commands are handled by Domain Objects grouped into aggregates. ReSolve implements aggregates as static objects containing sets of functions. These functions can be of one of the following two kinds:

- **[Command Handlers](write-side.md#aggregate-command-handlers)** - Handle commands and emit events in response.
- **[Projections](write-side.md#aggregate-projection-function)** - Build aggregate state from events so this state can be observed on the write side, for example to perform input validation.

### Creating an Aggregate

Use the following steps to implement the write side for your shopping list application.

To add an aggregate to you shopping list application, first define types of events that this aggregate can produce. Create an **eventTypes.js** file in the project's **common** folder and add the following content to it.

**common/eventTypes.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-2/common/eventTypes.js /^/ /\n$/)
```js
export const SHOPPING_LIST_CREATED = "SHOPPING_LIST_CREATED";

export const SHOPPING_ITEM_CREATED = "SHOPPING_ITEM_CREATED";
```

<!-- prettier-ignore-end -->

For now, your application requires only two event types:

- The SHOPPING_LIST_CREATED event signals about creation of a shopping list.
- The SHOPPING_ITEM_CREATED event signals about creation of an item within a shopping list.

Next, create a **shopping_list.commands.js** file in the **common/aggregates** folder. This file will contain command handlers for the ShoppingList aggregate. Add the following code to the file:

**common/aggregates/shopping_list.commands.js:**

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

As you can see, the file exports an object containing two command handlers. A command handler receives the aggregate state and a command payload. A payload can contain any arbitrary data related to the command. For example, the **createShoppingList** command's payload contains a shopping list name, and the **createShoppingItem** command payload contains an item's ID and text to display.

A command handler returns an event object. This object should contain the following obligatory fields:

- **type** - specifies the event's type;
- **payload** - specifies data associated with the event.

In the example code, the event payload contains the same fields that were obtained from the command payloads. The reSolve framework saves events returned by command handlers to a persistent **[event store](write-side.md#event-store)**. For now, your application is configured to use a file-based event store, which is sufficient for learning purposes. Later on, you will learn how to use different kinds of stores using **[storage adapters](advanced-techniques.md#adapters)**.

Your minimal shopping list aggregate is now ready. The last step is to register it in the application's configuration file. Open the **config.app.js** file, locate the **aggregates** configuration section and specify the following settings:

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

Now that your application is capable of handling commands, you can try sending such commands to create a shopping list and populate it with items.

ReSolve framework provides a standard API that allows you to send commands to an application's aggregate using HTTP requests.

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

X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Date: Wed, 19 Dec 2018 12:16:56 GMT
Connection: keep-alive
Content-Length: 139

{"type":"SHOPPING_LIST_CREATED","payload":{"name":"List 1"},"aggregateId":"shopping-list-1","aggregateVersion":1,"timestamp":1545221816663}

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
Date: Wed, 19 Dec 2018 12:17:53 GMT
Connection: keep-alive
Content-Length: 146

{"type":"SHOPPING_ITEM_CREATED","payload":{"id":"1","text":"Milk"},"aggregateId":"shopping-list-1","aggregateVersion":2,"timestamp":1545221873644}

```

Add a few more more items to have data to work with in future lessons.

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

Your application's write side currently does not perform any input validation. This results in the following flaws:

- The aggregate allows you to create shopping lists and items without specifying the required fields in the payload.
- It is possible to create more then one shopping list with the same aggregate ID.
- You can create items for a shopping list that does not exist.

You can overcome the first flaw by adding simple checks to each command handler:

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

To overcome the second and third flaws, you need to somehow store information about previously performed operations. You can achieve this by maintaining an **aggregate state**. This state is assembled on the fly by an aggregate **projection** from previously created events. To add a projection to the ShoppingList aggregate, create a **shopping_list.projection.js** file in the **common/aggregates** folder and add the following code there:

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

Register the create projection in the application configuration file:

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

The projection object should specify an obligatory **Init** function and a set of **projection functions**.

- The Init function initializes the aggregate state. In the example code, it creates a new empty object.
- Projection functions build the aggregate state based on the aggregate's events. Each such function is associated with a particular event type. The function receives the previous state and an event, and returns a new state based on the input.

In the example code, the SHOPPING_LIST_CREATED projection function adds the SHOPPING_LIST_CREATED event's timestamp to the state. This information can be used on the write side to find out whether and when a shopping list has been created for the current aggregate instance (i.e., an instance identified by the current aggregate ID).

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


# Trying to create a shopping list that already exists
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

---

## **Lesson 3** - Read side - Create a View Model to Query List Items

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-3)

Currently, your shopping list application has a fully functional write side. This allows your application to create shopping lists and items in these lists. However, with only a write side your application does not provide means to query the created data. This lesson will teach you how to implement the application's **[read side](resolve-app-structure.md#write-and-read-sides)** to answer data queries.

### Implement a View Model

A reSolve applications read side answers queries using **[Read Models](read-side.md#read-models)**. In this lesson, you will implement a **[View Model](read-side.md#view-model-specifics)**. View Models are Read Models used to build an application's state on the fly. This will allow you to keep the implementation simple. In a [later lesson](#implement-a-shopping-lists-read-model), you will learn how to use regular Read Models to answer queries based on accumulated persistent state.

Create a **shopping_list.projection.js** file in the **view-models** folder and add the following code to this file:

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-3/common/view-models/shopping_list.projection.js /^/ /\n$/)
```js
import { SHOPPING_LIST_CREATED, SHOPPING_ITEM_CREATED } from "../eventTypes";

export default {
  Init: () => null,
  [SHOPPING_LIST_CREATED]: (state, { aggregateId, payload: { name } }) => ({
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
};
```

<!-- prettier-ignore-end -->

You just defined a View Model **[projection](read-side.md#updating-a-read-model-via-projection-functions)**. A View Model projection runs for all events for a specific aggregate ID. Based on event data, a projection builds state. This state is then returned as a query response.

Now, you need to register the implemented View Model in the application's configuration file.

**config.app.js:**

```js
...
viewModels: [
  {
    name: 'ShoppingList',
    projection: 'common/view-models/shopping_list.projection.js'
  }
],
...
```

### Query a View Model via HTTP API

Now you can tests the read side's functionality. Send an HTTP request to query the Shopping List View Model:

```sh
$  curl -i -g -X GET "http://localhost:3000/api/query/ShoppingList/shopping-list-1"
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

The request URL has the following structure:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in **config.app.js**                                                         |
| aggregateIds | The comma-separated list of Aggregate IDs to include into the View Model. Use `*` to include all Aggregates |

---

## **Lesson 4** - Frontend - Display View Model Data in the Browser

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-4)

In the previous lesson, you modified your application so that it can answer queries. However, at this moment, your application does not provide a [frontent](frontend.md) that would present this data to an end-user. In this lesson, you will learn how to create a React frontend to display your reSolve application's data.

In this lesson you will only display a single shopping list's items to keep the example code simple. Later on, you will add support for multiple shopping lists and provide the required means of navigation between lists.

This tutorial sticks to React + Redux as the default choice for building a frontend for a reSolve application. Both React and Redux work well in conjunction with reSolve's infrastructure. ReSolve comes with the client **resolve-redux** library that provides HOCs allowing you to easily connect your React components to the backend.

Note that, if required, you can use the [standard HTTP API](curl.md) to communicate with a reSolve backend and implement the frontend using any client-side technology.

### Implement a React Frontend

Create a **ShoppingList.js** file in the client application's **containers** folder. In this file, implement a component that displays a list of values obtained from the **[data](frontend.md#obtain-view-model-data)** prop:

**client/containers/ShoppingList.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js /\/\// /^\}/)
```js
// The example code uses components from the react-bootstrap library to keep the markup compact.
import { ListGroup, ListGroupItem, Checkbox } from 'react-bootstrap'

export class ShoppingList extends React.PureComponent {
  render() {
    const list = this.props.data.list
    return (
      <ListGroup style={{ maxWidth: '500px', margin: 'auto' }}>
        {list.map(todo => (
          <ListGroupItem key={todo.id}>
            <Checkbox inline>{todo.text}</Checkbox>
          </ListGroupItem>
        ))}
      </ListGroup>
    )
  }
}
```

<!-- prettier-ignore-end -->

Now you can use the **resolve-redux** library's **connectViewModel** HOC to bind your component to the **ShoppingList** view model that you implemented earlier implemented earlier:

**client/containers/ShoppingList.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-4/client/containers/ShoppingList.js /export const mapStateToOptions/ /export default connectViewModel\(mapStateToOptions\)\(ShoppingList\)/)
```js
export const mapStateToOptions = (state, ownProps) => {
  return {
    viewModelName: 'ShoppingList',
    aggregateIds: ['shopping-list-1']
  }
}

export default connectViewModel(mapStateToOptions)(ShoppingList)
```

<!-- prettier-ignore-end -->

The connectViewModel HOC binds the original component to a reSolve View Model based on options specified by the **mapStateToOptions** function. The **data** prop that you used in your component's implementation is injected by this HOC and contains the View Model's response object. It is the same object that you saw when you manually performed a data query using the HTTP API in the lesson 3:

```js
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

Place the implemented shopping list within the application's root component:

**client/containers/App.js:**

```js
const App = () => (
  <div>
    ...
    <ShoppingList />
  </div>
)
```

Run your application to see the result:

![result](assets/tutorial/lesson4_result.png)

---

## **Lesson 5** - Frontend - Enable Data Editing

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-5)

### Modify Backend Functionality

Your application already implements logic required to add new list items. Apply the following modifications to the server code to also support item checking:

1. Add a new event type that signals about the item checkbox being toggled.

**common/eventTypes.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-5/common/eventTypes.js /export const SHOPPING_ITEM_TOGGLED/ /\n$/)
```js
export const SHOPPING_ITEM_TOGGLED = "SHOPPING_ITEM_TOGGLED";
```

<!-- prettier-ignore-end -->

2. Add a command handler that produces the added event in response to the **toggleShoppingItem** command.

**common/aggregates/shopping_list.commands.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-5/common/aggregates/shopping_list.commands.js /^[[:blank:]]+toggleShoppingItem/   /^[[:blank:]]{2}\}/)
```js
  toggleShoppingItem: (state, { payload: { id } }) => {
    if (!state || !state.createdAt) {
      throw new Error(`shopping list does not exist`)
    }
    if (!id) throw new Error('id is required')
    return {
      type: SHOPPING_ITEM_TOGGLED,
      payload: { id }
    }
  }
```

<!-- prettier-ignore-end -->

The event payload contains the toggled item's identifier.

4. Modify the **ShoppingList** View Model projection to apply **SHOPPING_ITEM_TOGGLED** events to the data sample.

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-5/common/view-models/shopping_list.projection.js /^[[:space:]]+\[SHOPPING_ITEM_TOGGLED\]/   /^[[:blank:]]+\}\)/)
```js
  [SHOPPING_ITEM_TOGGLED]: (state, { payload: { id } }) => ({
    ...state,
    list: state.list.map(item =>
      item.id === id
        ? {
            ...item,
            checked: !item.checked
          }
        : item
    )
  })
```

<!-- prettier-ignore-end -->

### Implement Data Editing UI

In the previous lesson, you connected your ShoppingList to a reSolve View Model. Because of this, the connected component's props already include an array of Redux action creators used to dispatch Redux actions on the client and send the corresponding commands to the reSolve application on the server. To make use of these action creators to implement editing in your application, update the ShoppingList component's View Model binding code as shown below:

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-5/client/containers/ShoppingList.js /export const mapDispatchToProps/   /\n$/)
```js
export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      ...aggregateActions
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    null,
    mapDispatchToProps
  )(ShoppingList)
)
```

<!-- prettier-ignore-end -->

In this code, the component is first connected to a **Redux** state using the **connect** HOC from the **react-redux** library. Then, the component is connected to a reSolve View Model as it was in the previous lesson. The **connect** function is called with the specified **mapDispatchToProps** function. This function takes reSolve aggregate actions from the components payload and wraps them into a **dispatch** function call using the the **bindActionCreators** function.

Now the ShoppingList component's props include the **toggleShoppingItem** function.

**common/view-models/shopping_list.projection.js:**

```js
render() {
  const toggleShoppingItem = this.props.toggleShoppingItem;
  ...
```

You can use this function to handle item checking on the client and send the **toggleShoppingItem** command to the server along with the required data in the payload.

In the code below, the **toggleShoppingItem** function is used to handle checkbox click events.

**client/containers/ShoppingList.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-5/client/containers/ShoppingList.js /^[[:space:]]+\<Checkbox/   /\<\/Checkbox\>/)
```js
              <Checkbox
                inline
                checked={todo.checked}
                onChange={toggleShoppingItem.bind(null, 'shopping-list-1', {
                  id: todo.id
                })}
              >
                {todo.text}
              </Checkbox>
```

<!-- prettier-ignore-end -->

In the same way, you can use the **createShoppingItem** function to add new shopping list items. The UI markup is shown below:

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-5/client/containers/ShoppingList.js /^[[:space:]]+\<ControlLabel\>Item name/   /\<\/Row\>/)
```js
        <ControlLabel>Item name</ControlLabel>
        <Row>
          <Col md={8}>
            <FormControl
              className="example-form-control"
              type="text"
              value={this.state.itemText}
              onChange={this.updateItemText}
              onKeyPress={this.onItemTextPressEnter}
            />
          </Col>
          <Col md={4}>
            <Button
              className="example-button"
              bsStyle="success"
              onClick={this.createShoppingItem}
            >
              Add Item
            </Button>
          </Col>
        </Row>
```

<!-- prettier-ignore-end -->

This markup uses the following methods to handle UI interaction.

**common/view-models/shopping_list.projection.js:**

```js
createShoppingItem = () => {
  this.props.createShoppingItem('shopping-list-1', {
    text: this.state.itemText,
    id: Date.now().toString()
  })

  this.setState({
    itemText: ''
  })
}

updateItemText = event => {
  this.setState({
    itemText: event.target.value
  })
}

onItemTextPressEnter = event => {
  if (event.charCode === 13) {
    event.preventDefault()
    this.createShoppingItem()
  }
}
```

After these steps, your application's client UI should look as shown below.

![result](assets/tutorial/lesson5_result.png)

---

## **Lesson 6** - Frontend - Support Multiple Shopping Lists

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-6)

In the previous two lessons, you have been implementing the client-side UI for viewing and editing items in a shopping list. However, you may have noticed that your application's functionality is incomplete: it is possible use HTTP API to create multiple shopping lists, but the client UI only allows viewing and editing only one specific list, namely **shopping-list-1**:

**client/containers/ShoppingList.js:**

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

In the [Lesson 3](#lesson-3-read-side-create-a-view-model-to-query-list-items), you have implemented a View Model used to obtain information about shopping lists with the specified aggregate ID's. Although it is possible to use the same approach for obtaining the list of all available shopping lists, there is a strong reason not to do so.

Consider a situation, in which your application has been running in a production environment for a long time and a large number of shopping lists has been created. If you used a View Model to answer queries, a resulting data sample would be generated on the fly for every requests using events from the beginning of the history, which will result in a huge performance overhead on _each request_. Note that it is not a problem when you use a View Model to obtain a single list's items as the item count is always considerably small.

To overcome this issue, implement a ShoppingLists **[Read Model](read-side.md#read-models)**. This Read Model will gradually accumulate its state based on incoming events and store this state in the Read Model Storage. This part of the functionality is implemented by the Read Model **[projection](read-side.md)**:

**common/read-models/shopping_lists.projection.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.projection.js /^/   /\n$/)
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

You also need to implement **[resolver functions](read-side.md#resolvers)** that will answer queries using the accumulated data.

**common/read-models/shopping_lists.resolvers.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/common/read-models/shopping_lists.resolvers.js /^/   /\n$/)
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

**config.app.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/config.app.js /^[[:blank:]]+readModels:/ /\],/)
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

Now you can implement the UI to display all available shopping list and create new shopping lists.

**client/containers/MyLists.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/containers/MyLists.js /class MyLists/ /^}/)
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

See the **shoppingLists** and **shoppingListsCreator** files to see the details of these components' implementation.

The implemented container component is bound to the ShoppingLists Read Model as shown below:

**client/containers/MyLists.js:**

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

**client/routes.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/routes.js /^/ /\n$/)
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

**client/containers/App.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/containers/App.js /^/ /\n$/)
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

**client/containers/ShoppingList.js:**

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

For now, binding a component to a reSolve Read Model looks similar to how you bound the ShoppingList component to a View Model in the [Lesson 4](#lesson-4-frontend-display-view-model-data-in-the-browser). Run, your application and try adding a new shopping list using the implemented UI.

You will notice that although you application correctly sends commands to the backend, the client UI does not reflect the change made to the application state. A newly created shopping list only appears after you refresh the page. This is an expected behavior because Read Models are not reactive by default. This means that components connected to Read Models do not automatically synchronize their Redux state with the Read Model state on the server.

You can overcome this limitation by introducing optimistic UI updates as the next section describes.

### Support Optimistic UI Updates

With the optimistic UI updating approach, a component applies model changes to the client Redux state before sending them to the server using an aggregate command. Follow the steps below to provide such functionality.

First, define Redux actions that will perform updates:

**client/actions/optimistic_actions.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/actions/optimistic_actions.js /^/ /\n$/)
```js
export const OPTIMISTIC_CREATE_SHOPPING_LIST = 'OPTIMISTIC_CREATE_SHOPPING_LIST'
export const OPTIMISTIC_SYNC = 'OPTIMISTIC_SYNC'
```

<!-- prettier-ignore-end -->

Implement an optimistic reducer function that responds to these commands to update the corresponding slice of the Redux state:

**client/reducers/optimistic_shopping_lists.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/reducers/optimistic_shopping_lists.js /^/ /\n$/)
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

Provide a middleware that intercepts the service actions used for communication between Redux and reSolve:

**client/reducers/optimistic_shopping_lists_middleware.js:**

<!-- prettier-ignore-start -->

[embedmd]:# (../examples/shopping-list-tutorial/lesson-6/client/middlewares/optimistic_shopping_lists_middleware.js /^/ /\n$/)
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

---

## **Lesson 7** - Functionality Enhancements

[\[Get the Code for This Lesson\]](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-tutorial/lesson-7)

In this lesson, you will provide miscellaneous functionality enhancements to your Shopping List application in order to support the full set of data editing operations. These steps are not essential, but they will help you further deepen your understanding of the reSolve framework's fundamentals.

### Modify the Write Side

Define additional events to provide the missing functionality.

**common/event_types.js:**

```js
...
export const SHOPPING_LIST_RENAMED = 'SHOPPING_LIST_RENAMED'

export const SHOPPING_LIST_REMOVED = 'SHOPPING_LIST_REMOVED'

export const SHOPPING_ITEM_REMOVED = 'SHOPPING_ITEM_REMOVED'
```

Modify the aggregate projection to account for shopping list deletion.

**common/aggregates/shopping_list.projection.js:**

```js
[SHOPPING_LIST_REMOVED]: () => ({})
```

Define command handlers to provide the data editing functionality.

**common/aggregates/shopping_list.commands.js:**

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

Modify the ShoppingList View Model projection to account for the new functionality.

**common/view-models/shopping_list.projection.js:**

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

Modify the ShoppingLists Read Model projection.

**common/read-models/shopping_lists.projection.js:**

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

#### Add Static Content

Add the required static content to the application's **static** folder. The example application uses the following static files:

- The **Styles.css** file - Contains custom styles used by the application's client components.
- The **fontawesome.min.css** file an the **webfonts** folder - The standard Font Awesome distribution.
- The **close-button.png** image - An icon displayed by the button used to remove shopping list items.

#### Update Components

Modify the ShoppingLists component to support shopping list deletion.

**client/components/ShoppingLists.js:**

```js
<th className="example-table-action">Action</th>
...

<td className="example-table-action">
  <Button
    onClick={() => {
      this.props.removeShoppingList(id)
    }}
  >
    <i className="far fa-trash-alt" />
  </Button>
</td>

```

```js
const { lists, createShoppingList, removeShoppingList } = this.props
...
<ShoppingLists lists={lists} removeShoppingList={removeShoppingList} />
```

Modify the ShoppingList component to support shopping list renaming.

**client/containers/ShoppingList.js:**

```js
state = {
  shoppingListName: this.props.data && this.props.data.name
  ...
}

renameShoppingList = () => {
  this.props.renameShoppingList(this.props.aggregateId, {
    name: this.state.shoppingListName
  })
}

onShoppingListNamePressEnter = event => {
  if (event.charCode === 13) {
    event.preventDefault()
    this.renameShoppingList()
  }
}

updateShoppingListName = event => {
  this.setState({
    shoppingListName: event.target.value
  })
}
...

<FormControl
  type="text"
  value={this.state.shoppingListName}
  onChange={this.updateShoppingListName}
  onKeyPress={this.onShoppingListNamePressEnter}
  onBlur={this.renameShoppingList}
/>
```

Add list item deletion functionality.

**client/containers/ShoppingList.js:**

```js
const {
  ...
  removeShoppingItem
} = this.props

<Image
  className="example-close-button"
  src="/close-button.png"
  onClick={removeShoppingItem.bind(null, aggregateId, {
    id: todo.id
  })}
/>
```

The **Image** component is implemented as follows.

**client/containers/Image.js:**

```js
import { Image as BootstrapImage } from 'react-bootstrap'
import { connectStaticBasedUrls } from 'resolve-redux'

const Image = connectStaticBasedUrls(['src'])(BootstrapImage)

export default Image
```

#### Link Stylesheets:

The code sample below demonstrates how to link stylesheets to your application.

**client/containers/Header.js:**

```js
<Helmet>
  {css.map((href, index) => (
    <link rel="stylesheet" href={href} key={index} />
  ))}
  ...
</Helmet>
...
export default connectStaticBasedUrls(['css', 'favicon'])(Header)
```

**client/containers/App.js:**

```js
<Header
  css={['/fontawesome.min.css', '/style.css', ...]}
  ...
/>
```

#### Update the Optimistic Update Code

Modify the code performing optimistic UI updates to support shopping list deletion.

**client/actions/optimistic_actions.js:**

```js
...
export const OPTIMISTIC_REMOVE_SHOPPING_LIST = 'OPTIMISTIC_REMOVE_SHOPPING_LIST'
```

**client/reducers/optimistic_shopping_lists.js:**

```js
import { LOCATION_CHANGE } from 'react-router-redux'
...

  switch (action.type) {
    case LOCATION_CHANGE: {
      return []
    }
    case OPTIMISTIC_REMOVE_SHOPPING_LIST: {
      return state.filter(item => {
        return item.id !== action.payload.id
      })
    }
    ...
  }
```

**client/middlewares/optimistic_shopping_lists_middleware.js:**

```js
const optimistic_shopping_lists_middleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'removeShoppingList'
  ) {
    store.dispatch({
      type: OPTIMISTIC_REMOVE_SHOPPING_LIST,
      payload: {
        id: action.aggregateId
      }
    })
  }

  next(action)
}
```
