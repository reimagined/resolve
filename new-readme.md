
# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)

reSolve is a framework for developing apps based on **CQRS**, **Domain-Driven Design** and **Event Sourcing** using **React + Redux** on the client. It negates differences between your domain and technical languages, and allows you to focus on application code.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/new_readme/readme-technologies.png"></p>

* **1 minute** easy [setup](#installation)
* **Free and open source.** reSolve is free to use under the [MIT license](https://github.com/reimagined/resolve/blob/master/LICENSE.md).
* **Flexibility.** Great opportunities with [clear API](#documentation).

[<p align="center"><img src="https://github.com/reimagined/resolve/blob/new_readme/readme-start-button.png"></p>](#getting-started)

## **📑 Table of Contents**
* #### ️️️[🏗️ Why reSolve](#why-resolve)
    * [Reactivity](#reactivity)
    * [Distribution](#distribution)
    * [Highload](#highload)
    * [Fault Tolerance](#fault-tolerance)
    * [Unidirection Data Flow](#unidirection-data-flow)
* #### [🚀 Getting Started](#getting-started)
    * [Installation](#installation)
    * [Tutorials](#tutorials)
    * [Examples](#examples)
* #### [📚 Documentation](#documentation)
    * [Bacic Concepts](#basic-concepts)
    * [Compatibility](#compatibility)
    * [API References](#api-references)
* #### [📢 Get in Touch](#get-in-touch)

## <a name="why-resolve">**🏗️ Why reSolve**</a>

<p align="center"><img src="https://github.com/reimagined/resolve/blob/new_readme/readme-why-resolve.png"></p>

With reSolve you can easy and fast create different level difficulty applications. It could be applications like simple [ToDo List](#todo-list), or some reactive applications like StackOverflow, with distributed, highload and serverless architecture. Thanks to stack of technologies (CQRS, Event Sourcing, Domain-Driven Design, React + Redux) your application would be easy scalable, maintainable, so you can focus on application essence.

### <a name="reactivity"><img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60"> Your _Reactivity_ Is Our Work</a>

Reactive app displays all changes instantly, even if they occurred in another application instance. It doesn't matter what types of instances do you have: local, on cloud, mobile, or even all together. With reSolve you can forget about any lines of code for reactivity, because we have it out of the box, so any reSolve application is reactive by default.

//todo gif

### <a name="distribution">You Focus on Application, reSolve Provides The _Distribution_</a>

### <a name="highload">Say Hello to _Highload_ System</a>

### <a name="fault-tolerance">_Fault Tolerance_ As A Default</a>

### <a name="unidirection-data-flow">Develop with _Unidirectional Data Flow_</a>

## <a name="getting-started">**🚀 Getting Started**</a>

### <a name="installation">Installation</a>

We have a special package [create-resolve-app](packages/create-resolve-app) for creation of any reSolve based application. It can be one of the our examples, or any your application. By default `create-resolve-app` creates empty [Hello world](https://github.com/reimagined/resolve/tree/master/examples/hello-world) application.

//todo gif installation

The created application is hosted at http://localhost:3000/. We recommend you "First Application From Scratch" (//todo guid and link) tutorial to learn more about application structure and work with reSolve. Also it'd be helpfull: [documentation](#documentation), [tutorials](#tutorials) and [examples](#examples).

#### Using npx

> Note: Don't forget about [npx](https://www.npmjs.com/package/npx) installation.

```bash
npx create-resolve-app hello-world-app
cd hello-world-app
npm run dev
```

#### Using yarn

> Note: Don't forget about [yarn](https://yarnpkg.com/lang/en/) installation.

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

* First Application From Scratch (//todo guid and link)
* [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/ToDo%20List%20App%20Tutorial.md)

### <a name="examples">Examples</a>

Example setup is similar with new application creation, but it has `--example` or `-e` flag with example name.

//todo gif example installation

The created example is hosted at http://localhost:3000/. Also you can look at [tutorials](#tutorials) for some examples.

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

Example names:
* [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world)
* [todo](https://github.com/reimagined/resolve/tree/master/examples/todo)
* [todo-two-levels](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels)

## <a name="documentation">**📚 Documentation**</a>

### <a name="basic-concepts">Basic Concepts</a>

### <a name="compatibility">Compatibility</a>

### <a name="api-references">API References</a>

## <a name="get-in-touch">**📢 Get in Touch**</a>
