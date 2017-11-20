# **🛢 Read Model Adapters**
This folder contains [resolve-query](../resolve-query) read model adapters.

A read model adapter is an object that must contain the following functions:  
* `buildProjection` - wraps the projection.  
* `init` - initializes an adapter instance, returns API for interoperation with read-model storage.  
* `reset` - disposes an adapter instance.  

Read-model storage API is consists of following asynchronous functions:  
* `getReadable` - provides API for read-only access to store and subsequent retrieving data from store.  
* `getError` - returns last internal adapter error if failure occured.



Available adapters:  
* [resolve-readmodel-memory](./resolve-readmodel-memory)  
	Used to store a read model in memory.
