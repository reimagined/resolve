# Splitting Code Into Chunks
# Running Serverless
# Server-Side Rendering
# Process Managers (Sagas)

# Custom Adapters

[TODO] Don't use word "custom" - it implies that there are "normal" adapters. 
It is just that reSolve comes with number of adapters and other can be written.

[TODO] Also, I'm not sure we need to describe it in the main docs - maybe just leave a reference to adapters folder and 
leave some info there.

## Event store adapter

You can implement a custom adapter according to your requirements. 

An event storage adapter implementation should expose the following methods:

| Method Signature                                                  | Description                                    |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| saveEvent(event)                                                  | Saves event to the store.                      |
| loadEventsByTypes: (types, callback, startTime)                   | Gets events of the specified types.            |
| loadEventsByAggregateIds: (aggregateIds, callback, startTime)     | Gets events with the specified aggregate IDs   |


By default, events are stored in a **event-storage.db** file in the application's root folder. 

In a development environment you can reset the state of the system by removing the event store file/database.

[TODO] This is not what event store is doing "by default". In the reSolve template, in "dev" environment we are using simple in-memory event store 
(based on nedb?) that is using event-storage.db file to save events. You can configure a different adapter for "dev" and it will use something else.

# Snapshot store adapter

[TODO] We need to describe snapshot store api too

# Read model store

reSolve comes with abstract read-model storage API and several adapters. This allows you to abstract your projection and resolver function code from specific dbms.

But if you need to use some other system for your read model, such as full-text-search engine, OLAP or specific SQL database - you don't need to write a new adapter, you can just work with that system in the code of projection function and query resolver.

You can even bypass query resolver, if your read model storage system provides its own query interface.