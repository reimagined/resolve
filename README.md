# **reSolve**

reSolve is a toolset for building apps based on the CQRS and Event Sourcing patterns. 

It allows isomorphic definitions for aggregates and read models, and provides out-of-the-box integration with [React+Redux+Saga](https://github.com/xkawi/react-universal-saga). With reSolve, you can easily overcome the differences between your domain and technical languages, and focus on your application code.

Learn more on related concepts:

* [Why using DDD, CQRS and Event Sourcing](https://github.com/cer/event-sourcing-examples/wiki/WhyEventSourcing)

* [Education course for DDD (Domain Driven Design)](http://cqrs.nu/)

* [Building Scalable Applications Using Event Sourcing and CQRS](https://medium.com/technology-learning/event-sourcing-and-cqrs-a-look-at-kafka-e0c1b90d17d8)

* [Blog about DDD](http://danielwhittaker.me/category/ddd/)

## **Quick Installation**
Create a reSolve boilerplate application using the [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) package in one of the following ways.
use yarn:
```bash
yarn create resolve-app my-resolve-app
```
use npx:
```bash
npx create-resolve-app my-resolve-app
```
use npm:
```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
```
A new reSolve application will be created. Run the following commands to start it in the development mode:
```bash
cd my-resolve-app
npm run dev
```
To view your application, open [http://localhost:3000](http://localhost:3000/) in your browser.

To build the application for production and start it in the production mode, run:

```bash
npm run build
npm run start
```

The created application supports es6 syntax and hot reloading out of the box. For more information see this [guide](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app).

## **Packages**

reSolve includes the following libraries which can be used independently or all together:

App generator libraries:
* [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)  
	Create a boilerplate application based on reSolve.

Core libraries:
* [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)  
	Creates a function to execute a command.

* [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)  
	Serves as an event-store.

* [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)  
	Creates a function to execute a query.

* [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)  
	Helper for creating the Redux storage.


Drivers for event-store:
* Bus drivers specifying how to send events:
    * [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-zmq) 


* Storage drivers specifying where to store events:
    * [resolve-storage-file](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-file) (recommended for debugging purposes)
    * [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-memory) (recommended for debugging purposes)
    * [resolve-storage-mongo](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-mongo)


## **Examples**

The following examples show how to use `resolve-scripts` with `react-router v2.x.x`  and `react-router v4.x.x`, respectively.

* [resolve-scripts-with-router-2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2)  
	[resolve-scripts-with-router-4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4)  
	This example is an application with several aggregate types related to each other. It also shows how to implement a custom backend API server.

* [two-level todo list](https://github.com/reimagined/resolve/tree/master/examples/todo)
