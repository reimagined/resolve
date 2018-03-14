# Command

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

When you need to change the system's state, you send a Command. A command is addressed to a Domain Aggregate. An Aggregate is a cluster of logically related objects, containing enough information to perform a command as one transaction. It handles a command, checks whether it can be executed and generates an event to change the system's state. A new event is sent to Event Store. 
Refer to [DDD_Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html) or [DDD, Event Sourcing, and CQRS Tutorial: design](http://cqrs.nu/tutorial/cs/01-design) for more information on aggregates.
