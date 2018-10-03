# Configuration

[TODO] Main entry point is run.js - where app configuration is being assembled from several config files - default are below:

The app folder contains the following configuration files:

* **config.app.js** - Contains general app configuration settings. In this file, you should register the application's aggregates, read models and view models.
* **config.dev.js** - Contains configuration settings that target the development server.
* **config.prod.js** - Contains configuration settings that target the production server.
* **config.test_functional.js** - Contains configuration settings that target the testing environment.




# Write and Read Sides
In accordance with with the CQRS paradigm, a reSolve application is divided into **[write](write-side.md)** and **[read](read-side.md)** sides.
* The **[write side](write-side.md)** is represented by a set of aggregates, which execute commands.
In response to the received commands, aggregates emit events, which are then saved to the event store. 

[TODO] Remove view models from here, they are a read models as well, and do have query params.

[TODO] Read side reacts to events emitted by the write side and updates read models accordingly.

* The **[read side](read-side.md)** is used to query the application's data. The read side is represented by a set of **view models** and **read models**. Both a view model and read model are used to handle data queries with the following major differences:
  *  A **read model** gradually accumulates the event data in a storage based on the logic defined by the **projection**.  When the client queries the data, the data is pulled from the storage by the **resolver**, processed based on the provided arguments and sent to the client in the required form.
  * A **view model** does not use a storage, neither does it provide a resolver to prepare data in response to queries. Instead, a view model builds a data sample from events only for one or several specified **aggregate IDs**. Generally, the data sample is built based on events from the very beginning of the history on every request, but you can also store intermediate snapshots to optimize the system resource consumption.

[TODO] Just add - reSolve provides one special kind of read model - view model. Instead of mutating some store, view model is assembled on the fly and compartible with redux, thus it can be updated reactively on the client.


[TODO] next three paragraphs are not really necessary, or should be explained further.

All interactions with the event store are abstracted away by the system (You do not interact with the event store directly).

It is important to understand that the read side and the write side do not and should never have intersecting functionality. 

The framework architecture imposes the functional programming, so both the read and write sides should never mutate any data outside of their scope.

[TODO] lets move storage adapters section to somewhere else, it not really a part of app structure

# Storage Adapters
Storage adapters provide a simple interface for controlling how your resolve app stores its data.

A reSolve application uses persistent data storages to store the following information:
* Events
* **Read model** state 
* **View model** snapshots 

A storage adapter encapsulates logic that defines *how* this data is stored. reSolve provides default adapters for the following types of data storages: 

* Event storage adapters:
  * MongoDB
  * MySQL
  * File-based
* Read model adapters:
  * MongoDB
  * MySQL
  * In-memory 

You can also provide your own implementation of data adapters by implementing a specific API interface.



# Folder Structure
A typical reSolve applications has the following general structure: 


```
📁 resolve-app
    📁 client
    📁 common
        📁 aggregates
        📁 read-models
        📁 view-models
        📁 sagas
```
The root folder contains the [configuration](#configuration) files.

The **client** folder contains all client code and markup.

[TODO] It would be called Server then. It is called Common, because some of this code (redux reducers) can be sent to client as well. We may change that, because it is still confusing...

The **common** folder contains sources for the server-side reSolve application This folder typically contains the following subfolders:
* **aggregates** - Contains source files for aggregate projections and command handlers.
* **read-models** - Contains source files for read model projections and resolvers.
* **view-models** - Contains source files for view model projections.
* **sagas** - Contains source files for sagas.

[TODO] Node, that this is just a default recommended structure, and you can rearrange files differently, and specify this in config file.