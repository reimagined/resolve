# Packages

reSolve includes the following libraries which can be used independently or simultaneously.

App generator libraries:
* 🚀 [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)  
	Creates a new application based on reSolve.

Core libraries:
* 📢 [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)  
	Creates a function to execute a command.

* 🏣 [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)  
	Provides an event store implementation.

* 🔍 [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)  
	Creates a function to execute a query.

* 🔩 [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)  
	Helper for creating the Redux storage.


Adapters for event store:
* 🚌 Bus adapters specifying how to send events:
    * [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters/resolve-bus-zmq) 


* 🛢 Storage adapters specifying where to store events:
    * [resolve-storage-mongo](https://github.com/reimagined/resolve/tree/master/packages/storage-adapters/resolve-storage-mongo)
	* [resolve-storage-lite](https://github.com/reimagined/resolve/tree/master/packages/storage-adapters/resolve-storage-lite)