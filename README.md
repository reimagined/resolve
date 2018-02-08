
# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier) [![GitHub issues](https://img.shields.io/github/issues/reimagined/resolve.svg)](https://github.com/reimagined/resolve/issues) [![GitHub forks](https://img.shields.io/github/forks/reimagined/resolve.svg)](https://github.com/reimagined/resolve/network) [![GitHub stars](https://img.shields.io/github/stars/reimagined/resolve.svg)](https://github.com/reimagined/resolve/stargazers) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE) [![Join the chat at https://gitter.im/reimagined/resolve](https://badges.gitter.im/reimagined/resolve.svg)](https://gitter.im/reimagined/resolve?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


reSolve is a framework for developing apps based on CQRS and Event Sourcing using [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) on the client. It can help negate differences between your domain and technical languages, and focus on your application code.

## **Table of Contents** 📑
* [Basic Concepts](#basic-concepts)
	* [Command and Aggregate](#command-and-aggregate)
	* [Event Store](#event-store)
	* [Read Model, View Model and Query](#read-model-view-model-and-query)
	* [See Also](#see-also)
* [Quick Installation](#quick-installation-)
* [Packages](#packages-)
* [Examples](#examples-)
* [Development](#development)

## **Basic Concepts**
reSolve is a set of libraries which can be used independently or simultaneously. Each library is responsible for a particular CQRS + Event Sourcing system part as shown in the image below.


![CQRS schema](https://user-images.githubusercontent.com/15689049/30436232-4932f952-9974-11e7-8e3d-575cc5de407e.png)  
_*This scheme is based on the "CQRS with Event Sourcing" image from the [Event Sourcing for Functional Programmers](http://danielwestheide.com/talks/flatmap2013/slides/#/) presentation.*_

### Command and Aggregate 
When you need to change the system's state, you send a Command. A command is addressed to a Domain Aggregate. An Aggregate is a cluster of logically related objects, containing enough information to perform a command as one transaction. It handles a command, checks whether it can be executed and generates an event to change the system's state. A new event is sent to [Event Store](#event-store). 
Refer to [DDD_Aggregates](https://martinfowler.com/bliki/DDD_Aggregate.html) or [DDD, Event Sourcing, and CQRS Tutorial: design](http://cqrs.nu/tutorial/cs/01-design) for more information on aggregates.

The [resolve-command](packages/resolve-command) library allows you to handle commands and send produced events to the event store based on aggregate definitions and their commands. All aggregates are passed to `resolve-command` as an array. The library creates an Aggregate Repository and finds or instantiates a particular aggregate to handle each command.

You can send a command on the client side by dispatching a redux action of the appropriate type. To do this, use the [sendComand](packages/resolve-redux#sendcommand) from the [resolve-redux](packages/resolve-redux) package.

Refer to [package documentation](packages/resolve-command#example) for an example of `resolve-command` usage.

### Event Store
The Event Store stores all events aggregates produce and delivers them to subscribers. It combines a persistent storage and message bus. 

reSolve provides the [resolve-es](packages/resolve-es) package containing the event store implementation, as well as [storage-adapters](packages/storage-adapters) and [bus-adapters](packages/bus-adapters) allowing you to specify where to store and how to send events.

### Read Model, View Model and Query
The Read Model represents a system state or its part. It is built using Projection functions. All events from the beginning of time are applied to a read model to build its current state. 

View model is a read model or part of it that represent a part of UI state and can live on client. It can be updated by Redux reducer function on the client and on the server.

Queries are used to get data from a read model and view model. 

See [Event Sourcing - Projections](https://abdullin.com/post/event-sourcing-projections/) or [DDD, Event Sourcing, and CQRS Tutorial: read models](http://cqrs.nu/tutorial/cs/03-read-models) for more information.

You can use [resolve-query](packages/resolve-query)  as a query. This package allows you to obtain data from a read model by a [GraphQL](http://graphql.org/learn/) request.

Refer to [package documentation](packages/resolve-query#example) for an example of `resolve-query` usage. 

### See Also
Learn more about related concepts:

* [Why using DDD, CQRS and Event Sourcing](https://github.com/cer/event-sourcing-examples/wiki/WhyEventSourcing)  
* [Education course for DDD (Domain Driven Design)](http://cqrs.nu/)
* [Building Scalable Applications Using Event Sourcing and CQRS](https://medium.com/technology-learning/event-sourcing-and-cqrs-a-look-at-kafka-e0c1b90d17d8)
* [Blog about DDD](http://danielwhittaker.me/category/ddd/)
* [Immutability Changes Everything](http://cidrdb.org/cidr2015/Papers/CIDR15_Paper16.pdf)



## **Quick Installation** 🚀
> Note: Installing a package globally may require administrative privileges. That means you have to use the sudo command for Unix-based systems or run a terminal with administrative privileges on Windows systems.


Create a new reSolve application using the [create-resolve-app](packages/create-resolve-app) package.

```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
cd my-resolve-app
npm run dev
```
![Terminal](https://user-images.githubusercontent.com/15689049/29822549-8513584c-8cd4-11e7-8b65-b88fdad7e4d1.png)
The application will be opened in your browser at [http://localhost:3000/](http://localhost:3000/).

Refer to the [reSolve Getting Started Guide](packages/create-resolve-app) for detailed information on how to create a new reSolve application and all the available scripts.

## **Packages** 📚

reSolve includes the following libraries which can be used independently or simultaneously.

App generator libraries:
* 🚀 [create-resolve-app](packages/create-resolve-app)  
	Creates a new application based on reSolve.

Core libraries:
* 📢 [resolve-command](packages/resolve-command)  
	Creates a function to execute a command.

* 🏣 [resolve-es](packages/resolve-es)  
	Provides an event store implementation.

* 🔍 [resolve-query](packages/resolve-query)  
	Creates a function to execute a query.

* 🔩 [resolve-redux](packages/resolve-redux)  
	Helper for creating the Redux storage.


Adapters for event store:
* 🚌 Bus adapters specifying how to send events:
    * [resolve-bus-memory](packages/bus-adapters/resolve-bus-memory) (recommended for debugging purposes)
    * [resolve-bus-rabbitmq](packages/bus-adapters/resolve-bus-rabbitmq)
    * [resolve-bus-zmq](packages/bus-adapters/resolve-bus-zmq) 


* 🛢 Storage adapters specifying where to store events:
    * [resolve-storage-mongo](packages/storage-adapters/resolve-storage-mongo)
	* [resolve-storage-lite](packages/storage-adapters/resolve-storage-lite)


## **Examples** 💻

* [two-level todo list](examples/todo)  
	This example is an application with several aggregate types related to each other. It also shows how to implement a custom backend API server.

## Development

* Report bugs and request features on our [issues page](https://github.com/reimagined/resolve/issues).
* Code released under the [MIT license](LICENSE.md).
* reSolve is developed by Developer Express Inc. ([https://devexpress.com](https://devexpress.com))

## Join us

* [Twitter](https://twitter.com/resolvejs)
* [Facebook](https://www.facebook.com/resolvejs/)
* Learn how to make [Hacker News application](https://github.com/reimagined/hacker-news-resolve)
