---
id: faq
title: FAQ
---

Q: Where to learn about CQRS and Event Sourcing <br/>
A: Refer to the following resources to familiarize yourself with the main concepts of CQRS and Event Sourcing:

- [Martin Fowler's Enterprise Architecture pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Greg Young classic explanation talk](https://www.youtube.com/watch?v=8JKjvY4etTY)
- [Greg Young's EventStore docs: Event Sourcing Basics](https://eventstore.org/docs/event-sourcing-basics/index.html)
- [Greg Young's DDD CQRS Class](https://www.youtube.com/watch?v=whCk1Q87_ZI)
- [Event Sourcing Made Simple](https://kickstarter.engineering/event-sourcing-made-simple-4a2625113224)
- [Migrating to Microservices and Event-Sourcing: the Dos and Dont’s](https://hackernoon.com/migrating-to-microservices-and-event-sourcing-the-dos-and-donts-195153c7487d)
- [CQRS.nu](http://www.cqrs.nu)
- [Event Sourcing: What it is and why it's awesome](https://barryosull.com/blog/event-sourcing-what-it-is-and-why-it-s-awesome), read other related posts at https://barryosull.com/blog

Q: What is the difference between Read Models and View Models <br/>
A: Read Models implement the standard event sourcing mechanisms.
View Models are a Redux-specific addition to the standard model. View models are reactive, the use websockets to synchronize their state with the redux state on the client.

Q: How to implement a Read Model with direct access to the underlying store <br/>
A: Implement a custom read model. Custom read models allow you to use custom logic to communicate with a read model store.

Q: How to send an aggregate command <br/>
A: On send a command from a client browser, use the standard HTTP API: <br/>
On the server side, you can send a command from an API handler or saga.

Q: How to perform integrity validation for unique values <br/>
A: In a distributed application, it is impossible to reliably perform such checks. Instead, you should check for duplicates in a read model or saga projection code and mark onу as incorrect.

Q: How to implement a frontend <br/>
A: There are three main approaches to frontend in reSolve:

- Use the HOCs from the **redux-resolve** library to connect a React components to a reSolve backend.
- Use the standard HTTP API exposed by a reSolve application.
- Write your own wrappers to the standard HTTP API.

Q: How do I drop persistent storages, replay the event log completely or selectively to recreate read models or saga storage, analyze, drop, recreate view model snapshots, etc. <br/>
A: Implement an API handler. The required API is available within the API handler through the `req.resolve` object.
