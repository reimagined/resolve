# **🛢 Storage Drivers**
This folder contains [resolve-es](../resolve-es) storage drivers.

A storage driver is an object that must contain the following functions:  
* `saveEvent` - gets an event to be saved in storage. Returns a Promise object that is resolved when the event is stored.
* `loadEventsByTypes` - gets an array of event types as the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the appropriate events are handled.
* `loadEventsByAggregateIds` - gets an aggregate id as the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the appropriate events are handled.

Available drivers:
* [resolve-storage-mongo](../storage-drivers/resolve-storage-mongo)  
	Used to store events in MongoDB.
* [resolve-storage-lite](../storage-drivers/resolve-storage-lite)  
	Used to store events in a local file.
