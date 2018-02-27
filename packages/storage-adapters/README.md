# **Storage Adapters**
This folder contains [resolve-es](../resolve-es) storage adapters.

A storage adapter is an object that must contain the following functions:  
* `saveEvent` - gets an event to be saved in storage. Returns a Promise object that is resolved when the event is stored.
* `loadEventsByTypes` - gets an array of event types as the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the appropriate events are handled.
* `loadEventsByAggregateIds` - gets an aggregate id as the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the appropriate events are handled.

Available adapters:
* [resolve-storage-mongo](../storage-adapters/resolve-storage-mongo)  
	Used to store events in MongoDB.
* [resolve-storage-lite](../storage-adapters/resolve-storage-lite)  
	Used to store events in a local file.
