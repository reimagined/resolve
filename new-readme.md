
# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)

A JavaScript framework for **CQRS**, **Domain-Driven Design** and **Event Sourcing** with good support for **React** and **Redux**. reSolve provides a new way to describe app's core logic and fully separate it from an auxiliary code.

<!-- TODO: FIX BLURRY PICTURE!!! -->
<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-technologies.png"></p>

* [Installation](#installation) is fully automated and takes 2 minutes.
* Free and open source ([MIT license](https://github.com/reimagined/resolve/blob/master/LICENSE.md)).
* Flexible and clear [API](#documentation).

<!-- TODO: FIX BLURRY PICTURE!!! -->
<!-- TODO: text="Try it now!" -->
[<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-start-button.png"></p>](#getting-started)

## **📑 Table of Contents**
* **[🏗️ Why reSolve](#why-resolve)**
* **[🚀 Getting Started](#getting-started)**
    * [Installation](#installation)
    * [Tutorials](#tutorials)
    * [Examples](#examples)
* **[📚 Documentation](#documentation)**
    * [Compatibility](#compatibility)
    * [Bacic Concepts](#basic-concepts)
* **[📢 Get in Touch](#get-in-touch)**

## <a name="why-resolve">**🏗️ Why reSolve**</a>

With reSolve you can create applications of any complexity level more efficiently. A single approach is used for a simple [ToDo List](#todo-list) and for a complicated reactive application like [Hacker News](https://github.com/reimagined/hacker-news-resolve) with distributed serverless architecture ready for high load. The technologies stack (CQRS, Event Sourcing, Domain-Driven Design, React + Redux) makes any reSolve application scalable and maintainable, so you can focus on a business logic instead of an auxiliary code.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-why-resolve-reactivity.gif"></p>

* 💎 Reactivity
* 💎 Distribution
* 💎 Highload
* 💎 Fault Tolerance
* 💎 Unidirectional Data Flow

## <a name="getting-started">**🚀 Getting Started**</a>

### <a name="installation">Installation</a>

The [create-resolve-app](packages/create-resolve-app) package is used to create a reSolve-based application. You can use it to get one of the examples, or make an empty application. By default, `create-resolve-app` generates an empty [Hello World](https://github.com/reimagined/resolve/tree/master/examples/hello-world) application. You can start working on your new reSolve application in just **2 minutes**.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-installation.gif"></p>

You can use one of the following tools to start a new reSolve aplication:

* [npx](https://www.npmjs.com/package/npx)

    ```sh
    npx create-resolve-app my-awesome-app
    cd my-awesome-app
    npm run dev
    ```

* [yarn](https://yarnpkg.com/lang/en/)

    ```sh
    yarn create resolve-app my-awesome-app
    cd my-awesome-app
    yarn run dev
    ```

* [npm](https://www.npmjs.com/)

    ```sh
    npm i -g create-resolve-app
    create-resolve-app my-awesome-app
    cd my-awesome-app
    npm run dev
    ```

    > Note: Installing a package globally (the first command) may require administrative privileges. That means you have to use the `sudo` prefix on Linux and MacOS, or start a terminal with administrative privileges on Windows.

The created application is accessible using the http://localhost:3000/ and http://<your_ip>:3000/ URLs (you can [change your URL settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)). Start learning reSolve with the [**First Application From Scratch**](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/First%20Application%20From%20Scratch.md) tutorial. Use the [**documentation**](#documentation), [**tutorials**](#tutorials) and [**examples**](#examples) to learn reSolve deeper.

### <a name="tutorials">Tutorials</a>

* [First Application From Scratch](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/First%20Application%20From%20Scratch.md)
* [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md)

### <a name="examples">Examples</a>

You can get a sample app using the `create-resolve-app` tool with the `-e` flag followed by an example name. Use the `create-resolve-app -h` command to list the available examples.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-example-installation.gif"></p>

The following tools are used to get a sample reSolve aplication:

* [npx](https://www.npmjs.com/package/npx)

    ```sh
    npx create-resolve-app todo-example -e todo
    ```

* [yarn](https://yarnpkg.com/lang/en/)

    ```sh
    yarn create resolve-app todo-example -e todo
    ```

* [npm](https://www.npmjs.com/)

    ```sh
    npm i -g create-resolve-app
    create-resolve-app todo-example -e todo
    ```

The created application is accessible using the http://localhost:3000/ and http://<your_ip>:3000/ URLs (you can [change your URL settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)).

The `create-resolve-app` can is capable to create the following apps:

* [**hello-world**](https://github.com/reimagined/resolve/tree/master/examples/hello-world)

    An empty app that can be used as a template for any reSolve application.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-hello-world-example.png"></p>

* [**top-list**](https://github.com/reimagined/resolve/tree/master/examples/top-list)

    This example demonstrates how to work with the [reactive read-models](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md) used to update information on the web page without reloading it.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-top-list-example.png"></p>

* [**todo**](https://github.com/reimagined/resolve/tree/master/examples/todo)

    This example demonstrates how to work with the [view-models](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md). The app's creation process is detailed in the [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md).

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-todo-example.png"></p>

* [**todo-two-levels**](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels)

    This example demonstrates how to work with view-models in the **all events subscribtion** case. Learn more about this case in the [View Model](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md) article. <!-- No info there -->

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-todo-two-levels-example.png"></p>

## <a name="documentation">**📚 Documentation**</a>

### <a name="compatibility">Compatibility</a>

You can run and develop reSolve applications on **Linux**, **Mac** and **Windows** operating systems. It is also possible to integrate reSolve with the **React Native**, but this approach is currently **experimental**.

You can use any package manager, but we recommend using [**npx**](https://www.npmjs.com/package/npx) and [**yarn**](https://yarnpkg.com/lang/en/) instead of **npm**<!--, because ??? -->.

The minimum supported **NodeJS** version is **6.0.0**.

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
