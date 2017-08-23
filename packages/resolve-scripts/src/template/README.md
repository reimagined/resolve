# **ReSolve App**
This project is an application created with [Create ReSolve App](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app). It is a single page application (SPA) which represents a typical Todo List. This application is built on the CQRS and Event Sourcing principles, with React+Redux on client.

Create ReSolve App allows you to specify application blocks (aggregates, read models and UI part presented by React components) in the semi-declarative manner. With the `resolve-scripts` package, you don't need to write an API backend manually. Instead, `resolve-scripts` deploys backend and domain services to interact with the client which is wrapped into the `resolve-redux` package for automate interaction.

You can find detailed information on subject-related technologies and links to the corresponding resources here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).


## **Table of Contents**
* [Available Scripts](#available-scripts)
    * [npm run dev](#npm-run-dev)
    * [npm run build](#npm-run-build)
    * [npm start](#npm-start)
* [Project Structure Overview](#project-structure-overview)
    * [Client](#client)
    * [Common](#common)
    * [Configuration](#configuration)
    * [E2E-tests](#e2e-tests)
* [Aggregates and Read Models](#aggregates-and-read-models)
* [Configuration Files](#configuration-files)
    * [resolve.client.config](#resolveclientconfig)
        * [rootComponent](#rootComponent)
        * [createStore](#createStore)
    * [resolve.server.config](#resolveserverconfig)
        * [aggregates](#aggregates)
        * [bus](#bus)
        * [entries.createStore](#entriescreateStore)
        * [entries.rootComponent](#entriesrootComponent)
        * [events](#events)
        * [extendExpress](#extendExpress)
        * [initialState](#initialState)
        * [queries](#queries)
        * [storage](#storage)
    * [resolve.build.config](#resolvebuildconfig)
        * [extendWebpack](#extendWebpack)
* [Environment variables](#environment-variables)
    * [ROOT_DIR](#root_dir)
    * [Custom Environment Variables](#custom-environment-variables)


## **Available Scripts**
In the project directory, you can run:

### `npm run dev`
Runs the app in the development mode.

Two web servers are  started: one - for the frontend/UI part, based on webpack-dev-server on the 3001 port by default, and another one - for the API backend part to provide API for reSolve endpoints, based on express on the 3000 port. Development servers provide all required debugging capabilities, including [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) and [source maps](https://webpack.js.org/configuration/devtool/).

Open [http://localhost:3000](http://localhost:3000/) to view the app in the browser.

### `npm run build`
Builds client and server bundles for production through Webpack.

Building is performed in the `NODE_ENV === 'production'` [mode](https://webpack.js.org/guides/production/#node-environment-variable), so the build is optimized. No additional http server for serving client bundle and assets are  built.

### `npm start`
Runs the built app in the production mode.

Open [http://localhost:3000](http://localhost:3000/) to view it in the browser.

## **Project Structure Overview**
[Create ReSolve App](https://www.npmjs.com/package/create-resolve-app) is an NPM package referenced to the latest versions of the [reSolve framework packages](https://github.com/reimagined/resolve/tree/master/packages). It consists of the common isomorphic part which describes domain business logic, and React components for the presentation part. No implicit server part is needed - it is encapsulated in `resolve-scripts`, but can be customized by [config](#configuration-files). The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html) language.

```
resolve-app/
  .babelrc
  .eslintrc
  .flowconfig
  .gitignore
  .travis.yml
  LICENSE
  README.md
  package-lock.json
  package.json
  resolve.build.config.js
  resolve.client.config.js
  resolve.server.config.js
  client/
    actions/
      index.spec.js
      index.js
    components/
      App.js
      Footer.js
      Link.js
      TodoList.js
      Todo.js
    containers/
      AddTodo.js
      FilterLink.js
      VisibleTodoList.js
    reducers/
      index.js
      todos.spec.js
      todos.js
      visibilityFilter.js
  common/
    aggregates/
      index.js
      todo-events.js
      todo.js
    read-models/
      index.js
      todos.js
    store/
      index.js
  static/
    favicon.ico
  tests/
    testcafe_runner.js
    e2e-tests/
      index.test.js
```

### **Client**
The client side is located in the `client/` folder and exports two key endpoints: root React component and Redux store creator function. These entry points to the client part must be specified in the [resolve.client.config.js](#resolveclientconfig) configuration file located in the root directory.

Any customization like adding routing or applying middleware or saga can be performed by proper wrapping original UI entry points into subsidiary entities and specifying them in an appropriate config section. The following examples show how to use a react router as UI entry point: 
* [react-router-2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2)  
* [react-router-4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4)

### **Common**
The `common/` folder contains isomorphic application part which represents business logic distributed between server and client in the same code. Domain logic is described in the reSolve-compatible format and appears in [aggregate and read model](#aggregates-and-read-models) declarations.

### **Configuration**
Create ReSolve App provides declaration configuration instead of imperative coding server-side part. Config allows you to customize React client and server-side rendering, declare domain business logic in terms of Event Sourcing with reSolve library, and modify webpack behaviour for the development and production modes.

Config for client side, server side and building phase are split into three segregated files:
* [resolve.client.config.js](#resolveclientconfig)  
* [resolve.server.config.js](#resolveserverconfig)  
* [resolve.build.config.js](#resolvebuildconfig)  

This approach allows you to simplify including non-isomorphic code and third-party libraries into an application by separating dependencies, and also hold all ES5 code for building phase in only one file.

### **E2E-tests**
The system operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates interaction with UI. After you modify code, start functional tests to check whether everything works successfully.

## **Aggregates and Read Models**
Common business/domain logic of an application consists of two parts - aggregates and read models.
* An *aggregate* is responsible for a system behavior and encapsulation of business logic. It responses to commands, checks whether they can be executed and generates events to change the current status of a system.
* A *read model* provides the current state of a system or its part in the given format. It is built by processing all events happened to the system, through a projection function.

Aggregates and read models are located in the corresponding directories and defined in a special isomorphic format, which allows them to be used on the client and server side.
* On the client side, aggregates are transformed into Redux action creators, and read models - into Redux reducers.
* On the server side, aggregates and read models are applied directory in the reSolve event sourcing framework.

A typical aggregate structure:

```js
export default {
    name: 'AggregateName', // Aggregate name for command handler, the same as aggregateType
    initialState: Immutable({}), // Initial state (Bounded context) for every instance of this aggregate type
    eventHandlers: {
        Event1Happened: (state, event) => nextState,  // Update functions for the current aggregate instance
        Event2Happened: (state, event) => nextState   // for different event types
    },
    commands: {
        command1: (state, arguments) => generatedEvent, // Function which generates events depending 
        command2: (state, arguments) => generatedEvent  // on the current state and argument list
    }
};
```

A typical read model structure:

```js
export default {
    name: 'ReadModelName', // Read model name for query handler
    initialState: Immutable({}), // Initial state for this read model instance
    eventHandlers: {
        Event1Happened: (state, event) => nextState,  // Update functions for the current read model instance
        Event2Happened: (state, event) => nextState   // for different event types
    }
    // This state results from the request to the query handler at the current moment
```

Note: To use read model declaration as a Redux reducer, some Immutable wrapper for a state object is required. We recommend to use the [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) library. Keep in mind that incorrect handling of an immutable object may cause performance issues.

## **Configuration Files**
### resolve.client.config
This file contains information for the client side of your application.

#### rootComponent 
*ReactElement*

Root component to be rendered on the client side.

#### createStore
*function(initialState: Object): store*

Function that takes initialState and returns a Redux store. Initial state is taken from the server side and is defined in [resolve.server.config.js](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts#initialstate)

### resolve.server.config
This file contains information for SSR and reSolve library.

#### aggregates
*Array*

Array of aggregates for [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command).

#### bus
*Object*

Contains a [bus driver](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers) and config to it.

#### entries.createStore
*function(initialState: Object): store*

Function that takes initialState (an object returned by the [initialState function](#initialstate)) and returns redux store. 

#### entries.rootComponent
*ReactElement*

Root component to be rendered on the server side.

#### events
*Object*

List of events.

#### extendExpress
*function(req, res, next)*

Allows to define custom routes and write express middleware.

#### initialState
*function(query): Promise*

Function that takes a [query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query) and returns a Promise. It's possible to get an initial state by query to read-model and then resolve it with Promise.

#### queries
*Array*

Array of read models for [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query).

#### storage
*Object*

Contains a [storage driver](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers) and config to it.

### resolve.build.config
#### extendWebpack
*function(clientConfig, serverConfig)*

Allows to extend the standard reSolve client and server configs.

## **Environment variables**
### ROOT_DIR
To change a root directory of an application, set the `ROOT_DIR` environment variable to the required value. For example, `export ROOT_DIR=/newurl`. After that the application will be available on [http://localhost:3000/newurl](http://localhost:3000/newurl).  The`ROOT_DIR` variable is available on the client side by `process.env.ROOT_DIR`.

### Custom Environment Variables
You can pass custom env variables to the client side. To do this, name a variable starting with the `RESOLVE_` prefix. After that, this variable will be available on the client and server side via the `process.env` object .
