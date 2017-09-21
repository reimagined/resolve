# **🛢 Storage Drivers**
This folder contains storage drivers for [resolve-es](../resolve-es).

Storage driver is an object that must contain three functions:  
* `saveEvent` - gets an event to be saved in a storage. Returns a Promise object that will be resolved when the event is stored.
* `loadEventsByTypes` - gets an array of event types as the first argument, and a function for handling event as the second argument. Returns a Promise object that will be resolved when all appropriate events are handled.
* `loadEventsByAggregateIds` - gets aggregateId as the first argument, and a function for handling event as second argument. Returns a Promise object that will be resolved when all appropriate events are handled.

Available drivers:
* [resolve-storage-memory](../storage-drivers/resolve-storage-memory)  
	Used to store events in memory.
* [resolve-storage-file](../storage-drivers/resolve-storage-file)  
	Used to store events in a local file.
* [resolve-storage-mongo](../storage-drivers/resolve-storage-mongo)  
	Used to store events in MongoDB.
