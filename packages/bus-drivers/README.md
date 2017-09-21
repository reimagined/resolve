# **🚌 Bus Drivers**
This folder contains bus drivers for [resolve-es](../resolve-es).

Bus driver is an object that must contain two functions:  
* `subscribe` - gets a callback that is called when an event is emitted. 
* `publish` - gets an event to be published.

Available drivers: 
* [resolve-bus-memory](resolve-bus-memory)  
	Used to emit and listen events by memory.
* [resolve-bus-rabbitmq](resolve-bus-rabbitmq)  
	Used to emit and listen events by RabbitMQ.
* [resolve-bus-zmq](resolve-bus-zmq)  
	Used to emit and listen events by ZeroMQ.
