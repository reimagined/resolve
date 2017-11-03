# **🛢 Read Model Adapters**
This folder contains [resolve-query](../resolve-query) read model adapters.

A read model adapter is an object that must contain the following functions:  
* `buildRead` - wraps the `read` function.
* `buildProjection` - wraps the projection.
* `init` - creates a repository API using `onDemandOptions`.
* `get` - gets a repository API using `onDemandOptions`.
* `reset` - removes a repository API using `onDemandOptions`.

Available adapters:
* [resolve-readmodel-memory](./resolve-readmodel-memory)  
	Used to store a read model in memory.
