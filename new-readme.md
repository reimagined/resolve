
# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)

reSolve is a framework for developing apps based on **CQRS**, **Domain-Driven Design** and **Event Sourcing** using **React + Redux** on the client. It negates differences between your domain and technical languages, and allows you to focus on application code.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-technologies.png"></p>

* **2 minute** easy [setup](#installation)
* **Free and open source.** reSolve is free to use under the [MIT license](https://github.com/reimagined/resolve/blob/master/LICENSE.md).
* **Flexibility.** Great opportunities with [clear API](#documentation).

[<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-start-button.png"></p>](#getting-started)

## **📑 Table of Contents**
* #### ️️️[🏗️ Why reSolve](#why-resolve)
* #### [🚀 Getting Started](#getting-started)
    * [Installation](#installation)
    * [Tutorials](#tutorials)
    * [Examples](#examples)
* #### [📚 Documentation](#documentation)
    * [Compatibility](#compatibility)
    * [Bacic Concepts](#basic-concepts)
* #### [📢 Get in Touch](#get-in-touch)

## <a name="why-resolve">**🏗️ Why reSolve**</a>

With reSolve you can easy and fast create different level difficulty applications. It could be applications like simple [ToDo List](#todo-list), or some reactive applications like StackOverflow, with distributed, highload and serverless architecture. Thanks to stack of technologies (CQRS, Event Sourcing, Domain-Driven Design, React + Redux) your application would be easy scalable, maintainable, so you can focus on application essence.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-why-resolve-reactivity.gif"></p>

* 💎 Reactivity
* 💎 Distribution
* 💎 Highload
* 💎 Fault Tolerance
* 💎 Unidirectional Data Flow

## <a name="getting-started">**🚀 Getting Started**</a>

### <a name="installation">Installation</a>

We have a special package [create-resolve-app](packages/create-resolve-app) for creation of any reSolve based application. It can be one of the our examples, or any your application. By default `create-resolve-app` creates empty [Hello world](https://github.com/reimagined/resolve/tree/master/examples/hello-world) application. You can start working with new reSolve application just in **2 minutes**.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-installation.gif"></p>

The created application is hosted at http://localhost:3000/ and http://<your_ip>:3000/ (you can [change your url settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)). We recommend you [**First Application From Scratch**](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/First%20Application%20From%20Scratch.md) tutorial to learn more about application structure and work with reSolve. Also it'd be helpfull: [**documentation**](#documentation), [**tutorials**](#tutorials) and [**examples**](#examples).

#### Using npx

> Note: Don't forget about [npx](https://www.npmjs.com/package/npx) installation.
```bash
npx create-resolve-app hello-world-app
cd hello-world-app
npm run dev
```

#### Using yarn

> Note: Don't forget about [yarn](https://yarnpkg.com/lang/en/) installation
```bash
yarn create resolve-app hello-world-app
cd hello-world-app
yarn run dev
```

#### Using npm
> Note: Installing a package globally may require administrative privileges. That means you have to use the sudo command for Unix-based systems or run a terminal with administrative privileges on Windows systems.

```bash
npm i -g create-resolve-app
create-resolve-app hello-world-app
cd hello-world-app
npm run dev
```

### <a name="tutorials">Tutorials</a>

* [First Application From Scratch](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/First%20Application%20From%20Scratch.md)
* [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md)

### <a name="examples">Examples</a>

Example setup is similar with new application creation, but it has `--example` or `-e` flag with example name. You can start working with reSolve example just in **2 minutes**.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-example-installation.gif"></p>

The created example is hosted at http://localhost:3000/ and http://<your_ip>:3000/ (you can [change your url settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)). Also you can look at [**tutorials**](#tutorials) for some examples.

#### Using npx
```bash
npx create-resolve-app todo-example -e todo
```

#### Using yarn
```bash
yarn create resolve-app todo-example -e todo
```

#### Using npm
```bash
create-resolve-app todo-example -e todo
```

* [**hello-world**](https://github.com/reimagined/resolve/tree/master/examples/hello-world)

It's a simple empty example that can be used like **reSolve application boilerplate**.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-hello-world-example.png"></p>

* [**top-list**](https://github.com/reimagined/resolve/tree/master/examples/top-list)

This example demonstrates **reactive read-models** that leads to client updating without page reloads. You can learn more about [read-models in documentation](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md)

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-top-list-example.png"></p>

* [**todo**](https://github.com/reimagined/resolve/tree/master/examples/todo)

This example demonstrates **simple work with view-models**. You can learn more in [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md) and [documentation](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md).

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-todo-example.png"></p>

* [**todo-two-levels**](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels)

This example demonstrates work with view-models in case of **all events subscribtion**. Sometimes, for example for fast application prototyping, it's necessary to have view-model on client with all server events instead of part. There's a special feature called **wildcard**, that allows to subscribe to all events, you can learn more about that in [documentation](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md).

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-todo-two-levels-example.png"></p>

## <a name="documentation">**📚 Documentation**</a>

### <a name="compatibility">Compatibility</a>

You can comfortably run and develop reSolve application for **Linux**, **Mac** and **Windows** operation systems using **bash** and **cmd** terminals. Also you can develop using **React Native**, but currently it's **experimental** approach.

You can use any package manager, but we recommend you to look at [**npx**](https://www.npmjs.com/package/npx) and [**yarn**](https://yarnpkg.com/lang/en/) apart from **npm**. We use exactly npx manager in our tutorials like a default way.

Minimum supported **NodeJS** version is **6.0.0**.

### <a name="basic-concepts">Basic Concepts</a>

* 📄 [**System Metaphor**](https://github.com/reimagined/resolve/blob/master/docs/System%20Metaphor.md)

The [**System Metaphor**](https://github.com/reimagined/resolve/blob/master/docs/System%20Metaphor.md) contains all terms that are used while reSolve application development. It helps to speak the same technical language and makes easy to understand documentation and core concepts in code. Also in [**docs folder**](https://github.com/reimagined/resolve/tree/master/docs) you can find detailed description with code for every core concept:

* [_Aggregate_](https://github.com/reimagined/resolve/blob/master/docs/Aggregate.md)
* [_Command_](https://github.com/reimagined/resolve/blob/master/docs/Command.md)
* [_Event Store_](https://github.com/reimagined/resolve/blob/master/docs/Event%20Store.md)
* [_Projection_](https://github.com/reimagined/resolve/blob/master/docs/Projection.md)
* [_Query_](https://github.com/reimagined/resolve/blob/master/docs/Query.md)
* [_Read Model_](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md)
* [_View Model_](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md)

* 📄 [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md)

The [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) topic helps you to understand common building principles of reSolve application architecture. Also it contains links to best practices of using Domain-Driven Design, CQRS and Event Sourcing. 

* 📄 [**Packages**](https://github.com/reimagined/resolve/blob/master/docs/Packages.md)

The [**Packages**](https://github.com/reimagined/resolve/blob/master/docs/Packages.md) article contains description and basic principles of working with reSolve packages. API and detailed information are in `readme` files for every packages:

* [_create-resolve-app_](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app)
* [_resolve-command_](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)
* [_resolve-es_](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)
* [_resolve-query_](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)
* [_resolve-redux_](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)
* [_resolve-scripts_](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts)

* [Bus Adapters](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters)
    * [_resolve-bus-memory_](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters/resolve-bus-memory)
    * [_resolve-bus-rabbit-mq_](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters/resolve-bus-rabbitmq)
    * [_resolve-bus-zmq_](https://github.com/reimagined/resolve/tree/master/packages/bus-adapters/resolve-bus-zmq)
    
* [Read Model Adapters](https://github.com/reimagined/resolve/tree/master/packages/readmodel-adapters)
    * [_resolve-readmodel-base_](https://github.com/reimagined/resolve/tree/master/packages/readmodel-adapters/resolve-readmodel-base)
    * [_resolve-readmodel-memory_](https://github.com/reimagined/resolve/tree/master/packages/readmodel-adapters/resolve-readmodel-memory)
    * [_resolve-readmodel-mysql_](https://github.com/reimagined/resolve/tree/master/packages/readmodel-adapters/resolve-readmodel-mysql)

* [Storage Adapters](https://github.com/reimagined/resolve/tree/master/packages/storage-adapters)
    * [_resolve-storage-base_](https://github.com/reimagined/resolve/tree/master/packages/storage-adapters/resolve-storage-base)
    * [_resolve-storage-lite_](https://github.com/reimagined/resolve/tree/master/packages/storage-adapters/resolve-storage-lite)
    * [_resolve-storage-mongo_](https://github.com/reimagined/resolve/tree/master/packages/storage-adapters/resolve-storage-mongo)

* 📄 [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)

The [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) article contains options description: environment variables, configs and others. 

* 📄 [**Contrubutors Guide**](https://github.com/reimagined/resolve/blob/master/docs/Contributors%20Guide.md)

The [**Contrubutors Guide**](https://github.com/reimagined/resolve/blob/master/docs/Contributors%20Guide.md) contains the development flow description for any contributors, basic rules and principles of commits checks.

## <a name="get-in-touch">**📢 Get in Touch**</a>

Feel free to contact us if you have any questions!

✉️ We'll glad to see your e-mails to **reimagined@devexpress.com**

💬 Join us on [**Twitter**](https://twitter.com/resolvejs). We post interesting arcticles, announcements, make twitter polls about reSolve development and even have disputes about related technologies, so follow us!

💻 We also have a [**Facebook**](https://www.facebook.com/resolvejs/) page, join us!

📃 You can find our articles on [**Medium**](https://medium.com/resolvejs)

❓ You are welcome with any your questions or enhancements in [**GitHub Issues**](https://github.com/reimagined/resolve/issues)

🔧 We'll happy if you became one of reSolve [**contributors**](https://github.com/reimagined/resolve/pulls)! Please, look at our [**Contrubutors Guide**](https://github.com/reimagined/resolve/blob/master/docs/Contributors%20Guide.md).

⭐️ Don't forget about **GitHub Stars** if you like reSolve!

<br/>
<br/>
<p align="center">reSolve is developed by</p>
<p align="center"><a href="https://devexpress.com">💛Developer Express Inc💛</a></p>
<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-footer-logo.png"></p>