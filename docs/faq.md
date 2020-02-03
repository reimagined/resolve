---
id: faq
title: FAQ
---

**Q**: Where can I learn about CQRS and Event Sourcing?<br/>
**A**: Refer to the following resources:

- [Martin Fowler's Enterprise Architecture pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Greg Young classic explanation talk](https://www.youtube.com/watch?v=8JKjvY4etTY)
- [Greg Young's EventStore docs: Event Sourcing Basics](https://eventstore.org/docs/event-sourcing-basics/index.html)
- [Greg Young's DDD CQRS Class](https://www.youtube.com/watch?v=whCk1Q87_ZI)
- [Event Sourcing Made Simple](https://kickstarter.engineering/event-sourcing-made-simple-4a2625113224)
- [Migrating to Microservices and Event-Sourcing: the Dos and Dont’s](https://hackernoon.com/migrating-to-microservices-and-event-sourcing-the-dos-and-donts-195153c7487d)
- [CQRS.nu](http://www.cqrs.nu)
- [Event Sourcing: What it is and why it's awesome](https://barryosull.com/blog/event-sourcing-what-it-is-and-why-it-s-awesome), read other related posts at https://barryosull.com/blog

**Q**: What is the difference between a Read Model and a View Model?<br/>
**A**: Read Models implement the standard event sourcing mechanisms.
View Models are a Redux-specific extension to these mechanisms. View models are reactive, they use websockets to synchronize their state with the redux state on the client.

**Q**: How to implement a Read Model with direct access to the underlying store?<br/>
**A**: Implement a [custom Read Model](read-side.md#custom-read-models). Custom Read Models allow you to use custom logic to communicate with a Read Model store.

**Q**: How to send an aggregate command?<br/>
**A**: To send a command from a client browser, use the [standard HTTP API](curl.md): <br/>


```
$ curl -X POST "http://localhost:3000/api/commands"
--header "Content-Type: application/json" \
--data '
{
  "aggregateName":"Todo",
  "type":"createItem",
  "aggregateId":"root-id",
  "payload": {
    "id":`date +%s`,
    "text":"Learn reSolve API"
  }
}
```

On the server side, you can [send a command](api-reference.md#executecommand) from an API Handler or Saga:  

<!-- prettier-ignore-start -->

[mdis]:# (../tests/saga-sample/saga.js#execute)
```js
await sideEffects.executeCommand({
  aggregateName: 'User',
  aggregateId: event.aggregateId,
  type: 'requestConfirmUser',
  payload: event.payload
})
```

<!-- prettier-ignore-end -->

**Q**: How to perform uniqueness validation for input values?<br/>
**A**: In a distributed application, it is impossible to reliably perform such checks. Instead, you should detect value duplicates in a Read Model or Saga projection code and mark duplicated values as incorrect.

**Q**: How to implement a frontend?<br/>
**A**: There are three main approaches to frontend development in reSolve:

- Use the HOCs from the [redux-resolve](frontend.md#resolve-redux-library) library to connect a React components to a reSolve backend.
- Use the [HTTP API](curl.md) exposed by a reSolve application.
- Write your own wrappers for the reSolve HTTP API.
