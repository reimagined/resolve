# **Bus Adapters** 🚌
This folder contains [resolve-es](../resolve-es) bus adapters.

A bus adapter is an object that must contain two functions:  
* `setTrigger` - gets a callback that is called when an event is emitted. 
* `publish` - gets an event to be published.

Available adapters: 
* [resolve-bus-memory](./resolve-bus-memory)  
	Used to emit and listen events using memory.
* [resolve-bus-rabbitmq](./resolve-bus-rabbitmq)  
	Used to emit and listen events using RabbitMQ.
* [resolve-bus-zmq](./resolve-bus-zmq)  
	Used to emit and listen events using ZeroMQ.
