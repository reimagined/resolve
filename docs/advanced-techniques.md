# Splitting Code Into Chunks
# Running Serverless
# Server-Side Rendering
# Process Managers (Sagas)

# Custom Adapters

You can implement a custom adapter according to your requirements. 

An event storage adapter implementation should expose the following methods:

| Method Signature                                                  | Description                                    |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| saveEvent(event)                                                  | Saves event to the store.                      |
| loadEventsByTypes: (types, callback, startTime)                   | Gets events of the specified types.            |
| loadEventsByAggregateIds: (aggregateIds, callback, startTime)     | Gets events with the specified aggregate IDs   |


By default, events are stored in a **event-storage.db** file in the application's root folder. 

In a development environment you can reset the state of the system by removing the event store file/database.
