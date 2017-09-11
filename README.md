# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![GitHub issues](https://img.shields.io/github/issues/reimagined/resolve.svg)](https://github.com/reimagined/resolve/issues) [![GitHub forks](https://img.shields.io/github/forks/reimagined/resolve.svg)](https://github.com/reimagined/resolve/network) [![GitHub stars](https://img.shields.io/github/stars/reimagined/resolve.svg)](https://github.com/reimagined/resolve/stargazers) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)


reSolve is a framework for developing apps based on CQRS and Event Sourcing, with [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) on the client. It can help you easily overcome the differences between your domain and technical languages, and focus on your application code.

## **📑 Table of Contents**
* [Basic Concepts](#️-basic-concepts)
	* [Command and Aggregate](command-and-aggregate)
	* [Event Store](#event-store)
	* [Read Model and Query](#read-model-and-query)
	* [See also](#see-also)
* [Quick Installation](#-quick-installation)
* [Packages](#-packages)
* [Examples](#-examples)

## **🏗️ Basic Concepts**
reSolve is a set of libraries which can be used independently or all together. Each library is responsible for a particular part of a CQRS + Event Sourcing system as shown on the image below.


![CQRS schema](https://user-images.githubusercontent.com/15689049/30266212-5610826e-96e7-11e7-92d1-b3609c874903.png)  
_*This scheme is based on the *CQRS with Event Sourcing* image from this [presentation](http://danielwestheide.com/talks/flatmap2013/slides/#/).*_

Let's explain basic concepts of this system.

### Command and Aggregate 
Whenever you need to change the system state, you have to send a command by `resolve-command`. Then, an appropriate [aggregate](#aggregate) handles the sent command and produces an event. You can send a command on the client side by dispatching a redux action of the appropriate type. To do this, use [sendComand](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#sendcommand) from the [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux) package.

An *aggregate* is responsible for a system behavior and encapsulation of business logic. It responses to commands, checks whether they can be executed and generates events to change the current status of a system. After an event is produced, it is saved and emitted by [Event Store](#eventstore).

Each aggregate builds its own state based on appropriate `aggregateId`. It is possible to validate a command based on an aggregate state and reject it if necessary.

All aggregates are passed to `resolve-command` as an array. This library creates an 
Aggregate Repository and chooses an appropriate aggregate to handle each command sent by a user.

See an example of the `resolve-command` usage [here](https://github.com/reimagined/resolve/tree/master/packages/resolve-command#example).

### Event Store
Event store is responsible for storing and emitting events. It handles each new event produced by an [aggregate](#aggregate). The [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es) package provides the event store implementation. Event store combines a persistent storage and message bus, so a set of 
 [storage-drivers](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers) and [bus-drivers](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers) is available for `resolve-es` to store and emit events, respectively.

### Read Model and Query
Rread Model is built by Projection functions. All events from the beginning of times are applied to Read Model to build its current state. Queries are used to get data from Read Model. [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query) is used as a query. This package allows you to observe data from Read Model by GraphQL request.

See an example of `resolve-query` usage [here](https://github.com/reimagined/resolve/tree/master/packages/resolve-query#example).

### See Also
Learn more about related concepts:

* [Why using DDD, CQRS and Event Sourcing](https://github.com/cer/event-sourcing-examples/wiki/WhyEventSourcing)

* [Education course for DDD (Domain Driven Design)](http://cqrs.nu/)

* [Building Scalable Applications Using Event Sourcing and CQRS](https://medium.com/technology-learning/event-sourcing-and-cqrs-a-look-at-kafka-e0c1b90d17d8)

* [Blog about DDD](http://danielwhittaker.me/category/ddd/)


## **🚀 Quick Installation**
> Note: global installation of a package may require administrative privileges. That means you have to use the `sudo` command for unix-based systems or run terminal with administrative privileges on windows systems to install a package globally.


Create a new reSolve application using the [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) package in one of the following ways.

Use yarn:
```bash
yarn create resolve-app my-resolve-app
```
or use npx:
```bash
npx create-resolve-app my-resolve-app
```
or use npm:
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

## **📚 Packages**

reSolve includes the following libraries which can be used independently or all together.

App generator libraries:
* 🚀 [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)  
	Create a new application based on reSolve.

Core libraries:
* 📢 [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)  
	Creates a function to execute a command.

* 🏣 [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)  
	Serves as an event-store.

* 🔍 [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)  
	Creates a function to execute a query.

* 🔩 [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)  
	Helper for creating the Redux storage.


Drivers for event-store:
* 🚌 Bus drivers specifying how to send events:
    * [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers/resolve-bus-zmq) 


* 🛢 Storage drivers specifying where to store events:
    * [resolve-storage-file](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-file) (recommended for debugging purposes)
    * [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-memory) (recommended for debugging purposes)
    * [resolve-storage-mongo](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers/resolve-storage-mongo)


## **💻 Examples**

* [resolve-scripts-with-router-2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2)  
	[resolve-scripts-with-router-4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4)  
	These examples show how to use `resolve-scripts` with `react-router v2.x.x`  and `react-router v4.x.x`, respectively.

* [two-level todo list](https://github.com/reimagined/resolve/tree/master/examples/todo)  
	This example is an application with several aggregate types related to each other. It also shows how to implement a custom backend API server.
