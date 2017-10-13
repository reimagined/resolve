# **🛢 ReadModel Adapters**
This folder contains ReadModel adapters for [resolve-query](../resolve-query).

ReadModel adapter is an object that must contain five functions:  
* `buildRead` - wraps the read.
* `buildProjection` - wraps the projection.
* `init` - creates a repository api by onDemandOptions.
* `get` - gets a repository api by onDemandOptions.
* `reset` - removes a repository api by onDemandOptions.

Available adapters:
* [resolve-readmodel-memory](./resolve-readmodel-memory)  
	Used to store the state of ReadModel in Memory.
