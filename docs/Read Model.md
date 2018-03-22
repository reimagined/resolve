# Read Model

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

The Read Model represents a system state or its part. It is built using Projection functions. All events from the beginning of time are applied to a read model to build its current state. 

Read models consists of projection and resolvers side. Projection is function set, which receives domain events and performs read-model updating. Resolvers are endpoint facade functions, which receives arguments from the client, performs search and data extraction in the reading model and returns it to the client. Read model implies filling some storage via applying domain events. In each read model instance events come sequentially, and projection handler performs some reaction for them - usually, it's storage filling, but can be custom async action - for example, touching REST API of some service, saving file and etc.

Read model meant to know, which event types and affected time period had been used for it's filling. Usually read model implies persistence, however, it can be stored in memory, but most likely it's the occasion for using *view models*. Read model usually huge, and should not re-apply events from the beginning of time, excluding case with changing projection event handlers or storage structure.

Read models requires **adapter**, which provides United API for projection and resolvers. Resolve provides default adapters set, which wraps interaction with common databases as storages. Adapters in resolve packages are compatible and interchangeable and provide API wrapper for `NeDB`, `MySQL`, `MariaDB` and `AuroraDB` in AWS cloud.

End programmer can develop own adapter for support custom database, or generally, custom storage. Resolve library has API requirement, which adapter should satisfy - they listed in the appropriate documentation. If end programmer, who develops own read model adapter, wants compatibility and interchangeability with resolve adapters, it should be inherited from `resolve-read model-base`. In that case, all API verifications and internal actions will be performed automatically, and developer should only specify callbacks from target storage/database for predetermined actions set.
