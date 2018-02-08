# **Read Model Adapters** 🛢
This folder contains [resolve-query](../resolve-query) read model adapters.

A read model adapter is an object that should contain the following functions:  
* `buildProjection` - wraps the projection.  
* `init` - initializes an adapter instance, returns an API for interaction with a read model storage.  
* `reset` - disposes of an adapter instance.  

The read model storage API consists of the following asynchronous functions:  
* `getReadable` - provides an API to access (read-only) and retrieve data from a store.  
* `getError` - returns the last internal adapter error if a failure occurred.

Available adapters:  
* [resolve-readmodel-memory](./resolve-readmodel-memory)  
	Used to store a read model in memory.
* [resolve-readmodel-mongo](./resolve-readmodel-mongo)  
	Used to store a read model in MongoDB.
* [resolve-readmodel-redis](./resolve-readmodel-redis)
	Used to store a read model in Redis.
