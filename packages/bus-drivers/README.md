# **:bus: Bus Drivers**
This folder contains bus drivers for `resolve-es`.

Bus driver is an object that must contain two functions:  
`setTrigger` - gets a callback that is called when an event is emitted.  
`publish` - gets an event to be published.

Available drivers: 
* [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-memory)  
	Used to emit and listen events by memory.
* [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-rabbitmq)  
	Used to emit and listen events by RabbitMQ.
* [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-zmq)  
	Used to emit and listen events by ZeroMQ.
