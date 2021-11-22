---
id: faq
title: FAQ
description: This article provides answers to frequently asked questions about the reSolve framework.
---

**Q**: Where can I find information about CQRS and Event Sourcing?<br/>
**A**: Refer to the following resources:

- [Martin Fowler's Enterprise Architecture pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Greg Young classic explanation talk](https://www.youtube.com/watch?v=8JKjvY4etTY)
- [Greg Young's EventStore docs: Event Sourcing Basics](https://eventstore.org/docs/event-sourcing-basics/index.html)
- [Greg Young's DDD CQRS Class](https://www.youtube.com/watch?v=whCk1Q87_ZI)
- [Event Sourcing Made Simple](https://kickstarter.engineering/event-sourcing-made-simple-4a2625113224)
- [Migrating to Microservices and Event-Sourcing: the Dos and Dont’s](https://hackernoon.com/migrating-to-microservices-and-event-sourcing-the-dos-and-donts-195153c7487d)
- [CQRS.nu](http://www.cqrs.nu)
- [Event Sourcing: What it is and why it's awesome](https://barryosull.com/blog/event-sourcing-what-it-is-and-why-it-s-awesome) and other related posts at https://barryosull.com/blog

**Q**: What is the difference between a Read Model and a View Model?<br/>
**A**: Read Models implement the standard event sourcing mechanisms.
View Models are a Redux-specific extension to these mechanisms. View models are reactive and use websockets to synchronize their state with the redux state on the client.

**Q**: How to implement a Read Model with direct access to the underlying store?<br/>
**A**: Implement a [custom Read Model](read-side.md#custom-read-models). Custom Read Models allow you to use custom logic to communicate with a Read Model store.

**Q**: How do I send an aggregate command?<br/>
**A**: To send a command from a client browser, use the reSolve HTTP API or one of the available client libraries. Refer to the [Frontend](frontend.md) article for more information.

On the server side, you can [send a command](api/saga.md#executecommand) from an API Handler or Saga:

**Q**: How do I perform validation to ensure input values are unique?<br/>
**A**: In a distributed application, it is not possible to perform reliable checks. You should detect value duplicates in a Read Model or Saga projection code and mark duplicated values as incorrect.

**Q**: How to implement a frontend?<br/>
**A**: There are three main approaches to frontend development in reSolve:

- Use one of the available client libraries. Refer to the [Frontend](frontend.md) article for more information.
- Use the [HTTP API](frontend.md#http-api) exposed by a reSolve application.
- Write your own wrappers for the reSolve HTTP API.
