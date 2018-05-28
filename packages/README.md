# **reSolve Packages**
The reSolve framework includes the following packages.

App generator libraries:
* [create-resolve-app](create-resolve-app)  
	Create a new application based on reSolve.

Core libraries:
* [resolve-auth](resolve-auth)
    Helper for authentication.

* [resolve-command](resolve-command)  
	Creates a function to execute a command.

* [resolve-es](resolve-es)  
	Serves as an event-store.

* [resolve-query](resolve-query)  
	Creates a function to execute a query.

* [resolve-redux](resolve-redux)  
	Helper for creating the Redux storage.


Adapters for event-store:
* Bus adapters specifying how to send events:
    * [resolve-bus-memory](bus-adapters/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](bus-adapters/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](bus-adapters/resolve-bus-zmq) 


* Storage adapters specifying where to store events:
    * [resolve-storage-mongo](storage-adapters/resolve-storage-mongo)
    * [resolve-storage-lite](storage-adapters/resolve-storage-lite)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-readme?pixel)
