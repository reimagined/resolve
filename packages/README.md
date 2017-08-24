# **:books: reSolve Packages**
The reSolve framework includes the following packages.


App generator libraries:
* :rocket: [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)  
	Create a new application based on reSolve.

Core libraries:
* :loudspeaker: [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)  
	Creates a function to execute a command.

* :post_office: [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)  
	Serves as an event-store.

* :mag: [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)  
	Creates a function to execute a query.

* :nut_and_bolt: [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)  
	Helper for creating the Redux storage.


Drivers for event-store:
* :bus: Bus drivers specifying how to send events:
    * [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-zmq) 


* :floppy_disk: Storage drivers specifying where to store events:
    * [resolve-storage-file](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-file) (recommended for debugging purposes)
    * [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-memory) (recommended for debugging purposes)
    * [resolve-storage-mongo](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-mongo)
