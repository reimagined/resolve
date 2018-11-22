# Read side - Create a View Model to Query List Items

Currently, your shopping list application has a fully functional write side allowing you to create shopping lists and items in these lists. However, it does not provide means to query the created data. This lesson will teach you how to provide your application with the capability to answer data queries by implementing the application's **read side**.

### Implement a View Model

A reSolve applications read side answers queries using Read Models. In this lesson, you will implement a **View Model**, which is a special kind of a Read Model used to build an application's state on the fly, so you can keep the implementation simple. In later lesson, you will learn how to use regular Read Models to answer queries based on accumulated persistent state.

Create a **shopping_list.projection.js** file in the **view-models** folder and add the following code to this file:

**common/view-models/shopping_list.projection.js:**

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-3/common/view-models/shopping_list.projection.js /^/ /\n$/)
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

You just defined a View Model **projection**. A View Model projection runs for all events for a specific aggregate ID. Based on event data, a projection builds state. This state is then returned as a query response.

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

Now you can tests the read side's functionality by sending an HTTP request to query the Shopping List View Model. You can query a View Model by sending an HTTP request to your application as shown below:

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

The request url has the following structure:

```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters

| Name         | Description                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| viewModel    | The View Model name as defined in **config.app.js**                                                         |
| aggregateIds | The comma-separated list of Aggregate IDs to include into the View Model. Use `*` to include all Aggregates |
