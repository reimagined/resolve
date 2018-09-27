# Read Models and View Models
In a reSolve application, you can query data by sending your requests to **Read Models** and **View Models**. 
Read Models and View Models serve a similar purpose - they allow you to query the system data. In both cases this data is built based on events obtained from the event store. However, Read Models and View Models differ in both in how they treat the event data as what role they serve in an application:

  *  A **Read Model** gradually accumulates the event data in a storage based on the logic defined by the [projection](#updating_a_read_model_via_a_projection_function).  When the client queries the data, the data is pulled from the storage by the [resolver](#resolvers), processed based on the provided arguments and sent to the client in the required form.
  * A **View Model** does not use a storage, neither does it provide a resolver to prepare data in response to queries. Instead, a view model builds a data sample from events only for one or several specified **aggregate IDs**. Generally, the data sample is built based on events from the very beginning of the history on every request, but you can also store intermediate snapshots to optimize the system resource consumption.




# Configuring Read Models and View Models
### Configuring Read Models
All application's Read Models should be registered in the **config.app.js** file's **readModels** section:

``` js
const appConfig = {
  ...
  readModels: [
    {
      name: 'default',
      projection: 'common/read-models/default.projection.js',
      resolvers: 'common/read-models/default.resolvers.js',
      adapter: {
        module: 'common/read-models/readmodel_adapter.module.js',
        options: {
          pathToFile: 'readmodel.db'
        }
      }
    }
  ],
  ...
}

```
In the configuration object, specify the Read Model's name and the paths to the projection's and resolvers' definitions. Here, you can also specify the storage adapter settings for the Read Model.

### Configuring View Models
In the same way, you should register your View Models using the **viewModels** section:

``` js
const appConfig = {
  ...
  viewModels: [
    {
      name: 'storyDetails',
      projection: 'common/view-models/story_details.projection.js',
      serializeState: 'common/view-models/story_details.serialize_state.js',
      deserializeState: 'common/view-models/story_details.deserialize_state.js',
      snapshotAdapter: {
        module: 'common/view-models/snapshot_adapter.module.js',
        options: {
          pathToFile: 'snapshot.db',
        }
      }
    }
  ],
  ...
}
```
In the configuration object, specify the View Model's name and the path to the projection. You can also specify the storage adapter for View Model snapshots. Use the **serializeState** and **deserializeState** to specify paths to the serializer and deserializer functions for the View Model state.




# Initialize a Read Model
Each Read Model has an **Init** function that initializes the Read Model storage. 
reSolve defines a simple standard interface for initializing a storage. You can add tables to the storage using the defineTable method:
``` js
  Init: async store => {
    ...
    await store.defineTable('Comments', {
      indexes: { id: 'string' },
      fields: [
        'text',
        'parentId',
        'comments',
        'storyId',
        'createdAt',
        'createdBy',
        'createdByName'
      ]
    })
    ...
  },
```



# Updating a Read Model via a Projection Function
A projection function is used to accumulate the event data to a **Read Model store**. Each projection function takes the store object and event settings, including the aggregateID, timestamp and payload.


You can communicate with the store using the standard API. The code sample below demonstrates a typical Read Model projection function implementation:

``` js
[STORY_COMMENTED]: async (
  store, { aggregateId, timestamp, payload: { parentId, userId, userName, commentId, text } }
) => {
  const comment = { id: commentId, text, parentId, comments: [], storyId: aggregateId,
    createdAt: timestamp, createdBy: userId, createdByName: userName }

  await store.insert('Comments', comment)
  await store.update(
    'Stories',
    { id: aggregateId },
    { $inc: { commentCount: 1 } }
  )
}
...
```
The data from the populated store is then used by [resolvers](#resolvers) to prepare the final data samples in response to data requests.

You can force the system to re-populate the store using events from the start of the history by deleting the Read Model storage. This can be useful in the development environment and when deploying an updated version of the application. 




# Resolvers 
A **Read Model resolver** is the the part of the Read Model that handles data requests. A resolver function gets the store and requests arguments. Based on the arguments, the resolver function pulls the required data from the store and processes it to prepare the response object. 

The code sample below demonstrate a typical Read Model implementation:

``` js
comments: async (store, { first, offset }) => {
  const skip = first || 0
  const comments = await store.find(
    'Comments',
    {},
    null,
    { createdAt: -1 },
    skip,
    skip + offset
  )
  return Array.isArray(comments) ? comments : []
}
```
To learn how to send a request to a Read Model resolver, refer to the [Query a Read Model](#query_a_read_model) section. 





# View Model Specifics
A View Model does not use a storage to store intermediate data. Because there is no View Model storage, there is also no View Model resolvers - requests are handled directly by projection functions. 

A projection function takes a state and an event object, and re turns an updated state. For every request, a projection runs for every event with the specified aggregate ID from the beginning of the history.

The code sample below demonstrate a typical View Model projection function:
``` js
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
}),
```

To learn how to send a request to a View Model projection, refer to the [Query a View Model](#query_a_view_model) section. 
Note that a View model does not use the Read Model store in any way.





# Performing Queries Using HTTP API
### Query a Read Model
You can query a Read Model from the client side by sending a POST request to the following URL:
```
http://{host}:{port}/api/query/{readModel}/{resolver}
```
##### URL Parameters:
| Name          | Description
| ------------- | -----------------------
| **readModel** | The Read Model name as defined in [config.app.js](../examples/with-saga/config.app.js)
| **resolver**  | The name of a [resolver defined in the Read Model](#resolvers)

The request body should have the `application/json` content type and the following structure:

``` js
{
  param1: value1,
  param2: value2,
  // ...
  paramN: valueN
}
```
The object contains the parameters that the resolver accepts.

##### Example

Use the following command to get 3 users from the [with-saga](../examples/with-saga) example.

```sh
curl -X POST \
-H "Content-Type: application/json" \
-d "{\"page\":0, \"limit\":3}" \
"http://localhost:3000/api/query/default/users"
```


### Query a View Model
You can query a View Model from the client side by sending a POST request to the following URL:
```
http://{host}:{port}/api/query/{viewModel}/{aggregateIds}
```

##### URL Parameters
| Name      | Description
| --------- | -----------------------
| viewModel | The View Model name as defined in [config.app.js](../examples/shopping-list/config.app.js)
| aggregateIds | The comma-separated list of Aggregate IDs to include into the View Model. Use `*` to include all Aggregates


##### Example

Use the following command to get the current [shopping-list](../examples/shopping-list) example application's state.


```sh
curl -g -X GET "http://localhost:3000/api/query/Default/shoppingLists"
```


