# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![GitHub issues](https://img.shields.io/github/issues/reimagined/resolve.svg)](https://github.com/reimagined/resolve/issues) [![GitHub forks](https://img.shields.io/github/forks/reimagined/resolve.svg)](https://github.com/reimagined/resolve/network) [![GitHub stars](https://img.shields.io/github/stars/reimagined/resolve.svg)](https://github.com/reimagined/resolve/stargazers) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)


reSolve is a framework for developing apps based on CQRS and Event Sourcing, with [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) on the client. It can help you easily overcome the differences between your domain and technical languages, and focus on your application code.

## **📑 Table of Contents**
* [Basic Concepts](#️-basic-concepts)
	* [Command and Aggregate](command-and-aggregate)
	* [Event Store](#event-store)
	* [Read Model and Query](#read-model-and-query)
	* [See Also](#see-also)
* [Quick Installation](#-quick-installation)
* [Packages](#-packages)
* [Examples](#-examples)

## **🏗️ Basic Concepts**
reSolve is a set of libraries which can be used independently or all together. Each library is responsible for a particular part of a CQRS + Event Sourcing system as shown on the image below.


![CQRS schema](https://user-images.githubusercontent.com/15689049/30436232-4932f952-9974-11e7-8e3d-575cc5de407e.png)  
_*This scheme is based on the "CQRS with Event Sourcing" image from the [Event Sourcing for Functional Programmers](http://danielwestheide.com/talks/flatmap2013/slides/#/) presentation.*_

### Command and Aggregate 
When you need to change the system state, you send a Command. A command is addressed to a Domain Aggregate. Aggregate is a cluster of logically related objects, containing enough information to perform a command as one transaction. Aggregate handles a command, checks whether it can be executed and generates an event to change the system state. A new event is sent to [Event Store](#eventstore). 
For more information about aggregates, refer to [DDD_Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html) or [DDD, Event Sourcing, and CQRS Tutorial: design](http://cqrs.nu/tutorial/cs/01-design).

The [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command) library allows you to handle commands and send produced events to the event store based on definitions of aggregates and their commands. All aggregates are passed to `resolve-command` as an array. The library creates an Aggregate Repository, and finds or instantiates a particular aggregate to handle each sent command.

You can send a command on the client side by dispatching a redux action of the appropriate type. To do this, use [sendComand](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux#sendcommand) from the [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux) package.

For an example on `resolve-command` usage, refer to [package documentation](https://github.com/reimagined/resolve/tree/master/packages/resolve-command#example).

### Event Store
Event Store stores all events produced by aggregates and delivers them to subscribers. It combines a persistent storage and message bus. 

reSolve provides the [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es) package containing the event store implementation, as well as [storage-drivers](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers) and [bus-drivers](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers) allowing you to specify where to store and how to send events, respectively.

### Read Model and Query
Read Model represents a system state or its part. Read model is built by Projection functions. All events from the beginning of time are applied to a read model to build its current state. Queries are used to get data from a read model. 
For more information about read models, see [Event Sourcing - Projections](https://abdullin.com/post/event-sourcing-projections/) or [DDD, Event Sourcing, and CQRS Tutorial: read models](http://cqrs.nu/tutorial/cs/03-read-models).

You can use [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)  as a query. This package allows you to obtain data from a read model by a [GraphQL](http://graphql.org/learn/) request.

For an example of `resolve-query` usage, refer to [package documentation](https://github.com/reimagined/resolve/tree/master/packages/resolve-query#example).

### See Also
Learn more about related concepts:

* [Why using DDD, CQRS and Event Sourcing](https://github.com/cer/event-sourcing-examples/wiki/WhyEventSourcing)  
* [Education course for DDD (Domain Driven Design)](http://cqrs.nu/)
* [Building Scalable Applications Using Event Sourcing and CQRS](https://medium.com/technology-learning/event-sourcing-and-cqrs-a-look-at-kafka-e0c1b90d17d8)
* [Blog about DDD](http://danielwhittaker.me/category/ddd/)
* [Immutability Changes Everything](http://cidrdb.org/cidr2015/Papers/CIDR15_Paper16.pdf)



## **🚀 Quick Installation**
> Note: global installation of a package may require administrative privileges. That means you have to use the `sudo` command for unix-based systems or run terminal with administrative privileges on windows systems to install a package globally.


Create a new reSolve application using the [create-resolve-app](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) package.

```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
cd my-resolve-app
npm run dev
```
![Terminal](https://user-images.githubusercontent.com/15689049/29822549-8513584c-8cd4-11e7-8b65-b88fdad7e4d1.png)
The application will be opened in your browser at [http://localhost:3000/](http://localhost:3000/).

For detailed information on how to create a new reSolve application and all available scripts, refer to [reSolve Getting Started Guide](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app).

## **📚 Packages**

reSolve includes the following libraries which can be used independently or all together.

App generator libraries:
* 🚀 [create-resolve-app](packages/create-resolve-app)  
	Creates a new application based on reSolve.

Core libraries:
* 📢 [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)  
	Creates a function to execute a command.

* 🏣 [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)  
	Provides an event store implementation.

* 🔍 [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)  
	Creates a function to execute a query.

* 🔩 [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)  
	Helper for creating the Redux storage.


Drivers for event store:
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
