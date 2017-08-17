# **resolve**

Resolve is a toolset for building apps based on the CQRS and Event Sourcing patterns. 

It allows isomorphic definitions for aggregates and read models and provides out-of-the-box integration with [React+Redux+Saga](https://github.com/xkawi/react-universal-saga). With Resolve, you can easily overcome the differences between your domain and technical languages, and focus on your application code.

Learn more on related concepts:

* [Why using DDD, CQRS and Event Sourcing](https://github.com/cer/event-sourcing-examples/wiki/WhyEventSourcing)

* [Education course for DDD (Domain Driven Design)](http://cqrs.nu/)

* [Building Scalable Applications Using Event Sourcing and CQRS](https://medium.com/technology-learning/event-sourcing-and-cqrs-a-look-at-kafka-e0c1b90d17d8)

* [Blog about DDD](http://danielwhittaker.me/category/ddd/)

## **Quick Installation**

```bash
git clone https://github.com/reimagined/resolve-boilerplate my-app
cd my-app
npm install
npm run dev
```

A new resolve application will be created and run in the development mode. To view it, open [http://localhost:3000](http://localhost:3000/) in your browser.

To build the application for production and start it in the production mode, run:

```bash
npm run build
npm run start
```

The created application supports es6 syntax and hot reloading out of the box. For more information see this [guide](https://github.com/reimagined/resolve-boilerplate).

## **Packages**

The toolset includes next libraries:

* [resolve-bus](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus)

Bus for sending events with a driver specifying where to send.

* [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-memory)

Driver for resolve-bus to emit events using memory.

* [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-rabbitmq)

Driver for resolve-bus to emit events using RabbitMQ.

* [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-zmq)

Driver for resolve-bus to emit events using ZeroMQ.

* [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)

Creates a function to execute a command.

* [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)

Serves as an event-store.

* [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)

Creates a function to execute a query.

* [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)

Helper for creating the Redux storage.

* [resolve-storage](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage)

Serves as an event storage with a driver specifying where to store events.

* [resolve-storage-file](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-file)

Driver for resolve-storage to store events using a file.

* [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-memory)

Driver for resolve-storage to store events using memory.

* [resolve-storage-mongo](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-mongo)

Driver for resolve-storage to store events using MongoDB.

## **Examples**

The following examples show how to use a react router in the [standard resolve boilerplate](https://github.com/reimagined/resolve-boilerplate):

* [using react-router v2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2)

* [using react-router v4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4)

This example is an application with several aggregate types related to each other. It also shows how to implement a custom backend API server.

* [two-level todo list](https://github.com/reimagined/resolve/tree/master/examples/todo)

