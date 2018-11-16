# Read side - Create a View Model to Query List Items

Currently, your shopping list application has a fully functional write side allowing you to create new shopping list items. However it does not provide means to query the added items. This lesson will teach you how to provide your application with the capability to answer data queries by implementing the application's **read side**.

### Implement a View Model

A reSolve applications read side answers queries using Read Models. For a shopping list, you will implement a special kind of a View Model, which is used to build an application's state on the fly, so you can keep the implementation simple. In later lesson, you will learn how to use regular Read Models to answer queries based on accumulated persistent state.

Add a **shopping_list.projection.js** file to the **view-models** folder and add the following code to this file:

<!-- prettier-ignore-start -->
[embedmd]:# (../../examples/shopping-list-tutorial/lesson-3/common/view-models/shopping_list.projection.js /^/ /\n$/)
```js
import { SHOPPING_ITEM_CREATED } from '../eventTypes'

export default {
  Init: () => [],
  [SHOPPING_ITEM_CREATED]: (state, { payload: { id, text } }) => {
    return [...state, text]
  }
}
```
<!-- prettier-ignore-end -->

You just defined a View Model **projection**. A View Model projection runs for all events for a specific aggregate ID. Based on event data, a projection builds state. This state is then returned as a query response.

Now, you need to register the implemented View Model in the application's configuration file:

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
$  curl -i -g -X GET "http://localhost:3000/api/query/ShoppingList/*"
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 50
ETag: W/"32-QoPdRfMTxfncCZnYSqRYIDifC/w"
Date: Fri, 16 Nov 2018 12:10:58 GMT
Connection: keep-alive

[
  "Item 1",
  "Item 2",
  "Item 3",
  "Item 4"
]
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
