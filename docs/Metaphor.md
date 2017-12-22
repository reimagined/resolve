# System Metaphor
*This is a [shared story](http://c2.com/xp/SystemMetaphor.html) that let the team speak the same language.* 

We are building a Framework that let Developer do [Applications](#application) for their Users.
Application is written with Event Sourcing and CQRS, with React+Redux on the client.

When anybody wants to change the system state - it sends a Command to Command Processor (?), which looks into Aggregate Repository, finds or instantiates particular Domain Aggregate and gives it a Command to handle. Aggregate handles the Command and produces an Event or returns an error. Business logic mainly performed by Aggregate - it should have a required info in its state (bounded context) to perform the command. The Command is a transaction unit, so Aggregate should be a Transaction Boundary.

New Event is sent to Event Store. Event Store combines persistent storage and a message bus. All other parts of the system and has access to Event Store - to be able to restore its state on startup (storage) and keep it actual (bus). 

Queries are used to observe a state of the system. Queries are answered by Read Models. Read Model is built by Projection functions. All events from the beginning of times are applied to Read Model to build its current state (or state at particular moment in time if necessary)

Some Read Models are sent to the client UI to be a part of Redux app state. They are small enough to fit into memory and can be kept up-to date right in the browser. We call them View Models.

Business rules and long running processes are handled by Sagas (Process Manager?). Saga can listens for events, build it state, interact with other systems and have a logic that eventually issues commands to change system's (and this saga's) state.

## Framework
This is a set of libraries (node modules) and CLI scaffolging tools that lets Developer focus on the app code and have everything else work out of the box. Framework calls Developer's code when necessary.

## Application
Application contains a set of [Modules](#module) (should we call them Microservices?) that interact with each other. One module is considered a root of the application and it handles interaction with other modules if any. So essentially, application is a root module.

## Module
Module is relatively independent and reusable service that implement some Bounded Domain logic. 

## Command
Command is a request to change system state, so it should produce events as a result of its execution. CQRS principle dictates that command should not return any data. But is should return a result - whether command is executed and error description otherwise.
Command received should be routed to the Domain Aggregate instance that it is addressed to. 

## Domain Aggregate
This is a concept from Eric Evans DDD book. Domain Aggregate is a domain model that large enough to be able to perform a command as one transaction. Domain Aggregate boundary is a transaction boundary for its commands. In ES system each command is addressed to particular aggregate, and each event is related to one aggregate. Domain Aggregate restores its state from its event stream. When Domain Aggregate receives a command, it performs it and as a result produces events (in our system - a single event). 

## Event
Event describes a change in the system state. Event is a primary source of truth in the ES system. System state is calculated from all events that happened to the system. Event is immutable, event store is append-only. Each event is related to one particular Domain Aggregate. Event has name, other required system attributes such as version and timestamp and a payload containing specific event details.

## Read Model
Read model is a representation of system state or its part. It is used to answer Queries. It is built by processing all events from the beginnin (Reduce or Left fold of the event stream). Function that performs actual reduce called Projection (do we need a term Projection?).

## Projection, Reducer
This is a function that essentially takes an event and current state (read model) and produces a new state. Reducer (Redux term) does this literally - takes state, event and returns new state: (state, event) => state. If state/read model is something large (like a sorted list of millon items), it is just a function that takes event and mutates a read model - lets call this function a Projection. 
We going to implement a variant with pure Projection function - when it can define query that should be done before, and projection itself takes queryResult and event, and returns a mutation - some declarative description of what to change. 

## Query 
Query is a way to request some data from the read model - some part of it. We are going to use GraphQL as a query language.

## View Model
View model is a read model or part of it that represent a part of UI state and can live on client. It can be updated by Redux reducer function on the client and on the server. 

## Saga
Or Process Manager? This is something that listen to events, keeps its own state like read model and can issue commands based on its state and logic. This is kind of robotic user with its own program.

## Event Store
Event store stores all events and distributes them to consumers. It is a storage and a bus.