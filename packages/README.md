
# **📚 reSolve Packages**
The reSolve framework includes the following packages.


App generator libraries:
* 🚀 [create-resolve-app](create-resolve-app)  
	Create a new application based on reSolve.

Core libraries:
* 📢 [resolve-command](resolve-command)  
	Creates a function to execute a command.

* 🏣 [resolve-es](resolve-es)  
	Serves as an event-store.

* 🔍 [resolve-query](resolve-query)  
	Creates a function to execute a query.

* 🔩 [resolve-redux](resolve-redux)  
	Helper for creating the Redux storage.


Drivers for event-store:
* 🚌 Bus drivers specifying how to send events:
    * [resolve-bus-memory](bus-drivers/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](bus-drivers/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](bus-drivers/resolve-bus-zmq) 


* 🛢 Storage drivers specifying where to store events:
    * [resolve-storage-file](storage-drivers/resolve-storage-file) (recommended for debugging purposes)
    * [resolve-storage-memory](storage-drivers/resolve-storage-memory) (recommended for debugging purposes)
    * [resolve-storage-mongo](storage-drivers/resolve-storage-mongo)
