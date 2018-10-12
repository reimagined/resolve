# **Storage Adapters**

This folder contains [resolve-es](../../core/resolve-es) storage adapters.

A storage adapter is an object that must contain the following functions:

- `saveEvent` - gets an event to be saved in storage. Returns a Promise object that is resolved when the event is stored.
- `loadEvents` - gets an array of events filtered by the first argument and a function for handling an event as the second argument. Returns a Promise object that is resolved when all the persistent events are handled.

Available adapters:

- [resolve-storage-mongo](../storage-adapters/resolve-storage-mongo)  
   Used to store events in MongoDB.
- [resolve-storage-lite](../storage-adapters/resolve-storage-lite)  
   Used to store events in a local file.
- [resolve-storage-mysql](../storage-adapters/resolve-storage-mysql)  
   Used to store events in a MySQL base.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-storage-adapters-readme?pixel)
