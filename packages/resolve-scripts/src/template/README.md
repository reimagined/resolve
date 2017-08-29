
# **🚀 ReSolve App**
This project is an application created with [Create ReSolve App](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app). It is a single page application (SPA) which represents a typical Todo List. This application is built on the CQRS and Event Sourcing principles, with React+Redux on client.

Create ReSolve App allows you to specify application blocks (aggregates, read models and UI part presented by React components) in the semi-declarative manner. With the `resolve-scripts` package, you don't need to write an API backend manually. Instead, `resolve-scripts` deploys backend and domain services to interact with the client which is wrapped into the `resolve-redux` package for automate interaction.

You can find detailed information on subject-related technologies and links to the corresponding resources here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).


## **📑 Table of Contents**
* [Available Scripts](#-available-scripts)
    * [npm run dev](#npm-run-dev)
    * [npm run build](#npm-run-build)
    * [npm start](#npm-start)
* [Project Structure Overview](#️-project-structure-overview)
    * [Client](#-client)
    * [Common](#-common)
    * [Configuration](#-configuration)
    * [E2E-tests](#-e2e-tests)
* [Aggregates and Read Models](#️-aggregates-and-read-models)
* [Configuration Files](#-configuration-files)
    * [Client Config](#client-config)
        * [rootComponent](#rootcomponent)
        * [createStore](#createstore)
    * [Server Config](#server-config)
        * [aggregates](#aggregates)
        * [bus](#bus)
        * [entries.createStore](#entriescreatestore)
        * [entries.rootComponent](#entriesrootcomponent)
        * [initialSubscribedEvents](#initialsubscribedevents)
        * [filterSubscription](#filtersubscription)
        * [extendExpress](#extendexpress)
        * [initialState](#initialstate)
        * [queries](#queries)
        * [storage](#storage)
    * [Build Config](#build-config)
        * [extendWebpack](#extendwebpack)
* [Environment Variables](#-environment-variables)
    * [Environment Variables to Change URL](#environment-variables-to-change-url)
    * [Custom Environment Variables](#custom-environment-variables)


## **📋 Available Scripts**
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

## **🗂️ Project Structure Overview**
[Create ReSolve App](https://www.npmjs.com/package/creat-resolve-app) is an NPM package referenced to the latest versions of the [reSolve framework packages](https://github.com/reimagined/resolve/tree/master/packages). It consists of the common isomorphic part which describes domain business logic, and React components for the presentation part. No implicit server part is needed - it is encapsulated in `resolve-scripts`, but can be customized by [config](#-configuration-files). The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html) language.

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

### **🕴 Client**
The client side is located in the `client/` folder and exports two key endpoints: root React component and Redux store creator function. These entry points to the client part must be specified in the [resolve.client.config.js](#client-config) configuration file located in the root directory.

Any customization like adding routing or applying middleware or saga can be performed by proper wrapping original UI entry points into subsidiary entities and specifying them in an appropriate config section. The following examples show how to use a react router as UI entry point: 
* [react-router-2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2)  
* [react-router-4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4)

### **🔗 Common**
The `common/` folder contains isomorphic application part which represents business logic distributed between server and client in the same code. Domain logic is described in the reSolve-compatible format and appears in [aggregate and read model](#️-aggregates-and-read-models) declarations.

### **📝 Configuration**
Create ReSolve App provides declarative configuration instead of imperative coding server-side part. Config allows you to customize React client and server-side rendering, declare domain business logic in terms of Event Sourcing with reSolve library, and modify webpack behaviour for the development and production modes.

Config for client side, server side and building phase are split into three segregated files:
* [resolve.client.config.js](#client-config)  
* [resolve.server.config.js](#server-config)  
* [resolve.build.config.js](#build-config)  

This approach allows you to simplify including non-isomorphic code and third-party libraries into an application by separating dependencies, and also hold all ES5 code for building phase in only one file.

### **🚦 E2E-tests**
The system operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates interaction with UI. After you modify code, start functional tests to check whether everything works successfully.

## **🏗️ Aggregates and Read Models**
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

## **🎛 Configuration Files**
### Client Config
The `resolve.client.config.js` file contains information for the client side of your application. In this file you, can define an entry point component and implement a redux store creation with the initial state for the client side.

* #### `rootComponent `
	Specifies a react component that will be rendered as a root component of the application.

	##### Example
	In this example, we create a simple react component and set it as a root component that will be shown on the application’s home page.

	###### resolve.client.config.js
	```js
	import React from 'react';

	export default {
	  rootComponent: () => (<h1>Root Component</h1>)
	}
	```

* #### createStore
	Takes the initial state from the server side (initialState defined in [resolve.server.config.js](#initialstate)) and returns a Redux store.

	##### Example
	This example shows a simple implementation of `createStore`.

	###### resolve.client.config.js
	```js
	import React from 'react';
	import { createStore } from 'redux';

  import reducers from './reducers';  // standard redux reducers

	export default {
	  rootComponent: () => (<h1>Root Component</h1>),
	  createStore: initialState => createStore(reducers, initialState)
	}
	```
	
  **Note:** Standard redux store creation excludes that the initialState is passed from the server side.

### Server Config
The `resolve.server.config.js` file contains information for reSolve library.

* #### aggregates
	Specifies an array of [aggregates](#️-aggregates-and-read-models) for [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command). Each command is addressed to a particular aggregate. When an aggregate receives a command, it performs this command and as a result produces an event, or returns an error if the command cannot be executed.

	##### Example
	In this example, we import an array of aggregate objects specified in the `aggregates.js` file.

	###### resolve.server.config.js
	```js
	import aggregates from './aggregates';

	export default {
	  aggregates	
	}
	```

* #### bus
	The bus is used to emit events. It is an object with the following structure 
	* `driver`: one of [bus drivers](https://github.com/reimagined/resolve/tree/master/packages/bus-drivers)
	* `params`: config that will be passed to a driver when it is initialized

	##### Example
	###### resolve.server.config.js
	```js
	import busDriver from 'resolve-bus-zmq';

	export default {
	  bus: {
	    driver: busDriver,
	    params: {
	      url: 'zmq_url'
        }
	  }
	}
	```

* #### entries

	It might be the same config as in `resolve.client.config.js`. But it is also possible to pass different `rootComponent` or `createStore` to server and client sides. It can be helpful in some cases (for example, see [resolve-scripts with react-router v4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4) and  [resolve-scripts with react-router v2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2)) but be  careful when using this approach - it may cause issues with SSR.

	##### Example
	###### resolve.server.config.js
	```js
	import clientConfig from './resolve.client.config';

	export default {
	  entries: clientConfig
	}
	```

* #### entries.createStore

	Takes the [initialState](#initialstate) function value and returns a Redux store.

	##### Example
	This example shows a simple implementation of `createStore`.

	###### resolve.server.config.js
	```js
	import { createStore } from 'redux';
	
	import reducers from './reducers'; // standard redux reducers

	export default {
	  entries: {
	    createStore: initialState => createStore(reducers, initialState)
	  }
	}
	```
  **Note:** Standard redux store creation excludes that the initialState is passed from the server side.

* #### entries.rootComponent
	
	Specifies a react component that will be rendered as a root component of the application.

	##### Example
	In this example, we create a simple react component and set it as a root component that will be shown on the application’s home page.

	###### resolve.server.config.js
	```js
	import React from 'react';

	export default {
	  entries: {
	    rootComponent: () => (<h1>Root Component</h1>)
	  }
	}
	```

* #### initialSubscribedEvents
	
	Initial list of events which should be transmitted into the client side after an SPA page has been loaded.
	The `initialSubscribedEvents` object consists of two fields for event subscription management: 
	- `types`  - by event types
	- `ids` - by aggregate identifiers

	##### Example
	###### resolve.server.config.js
	```js
	export default { 
	  initialSubscribedEvents: {
	    types: ['EVENT_TYPE_1', 'EVENT_TYPE_2'], 
	    ids: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2']
	  }
	}
	```

* #### filterSubscription
	A function that allows filtering requested event types and aggregate identifiers on the server side. It can be used for security purposes - to prevent custom client agents from sending requests to events. Use the `requestInfo` argument to segregate subscriptions of different clients.

	##### Example
	###### resolve.server.config.js
	```js
	export default { 
	  initialSubscribedEvents: { types: ['EVENT_TYPE'], ids: ['AGGREGATE_ID'] },
	  
	  filterSubscription(requestedEvents, requestInfo) => {
	    const eventTypes = requestedEvents.types.slice(0);
	    const waryEventIdx = eventTypes.indexOf(eventTypes.find(type => type === 'WARY_EVENT_TYPE'));
	    const cookie = requestInfo.headers && requestInfo.headers.cookie;
	    const userPrincipial = parsePrincipial(cookie);
	    
	    if(userPrincipial.role !== 'admin' && waryEventIdx > -1) {
	      eventTypes.splice(idx, 1);
	    }
	    
	    return {
	      ids: requestedEvents.ids,
	      types: eventTypes
	    };
	  }
	}
	```

* #### extendExpress
	A function that takes an express app. It is useful to define custom routes or express middlewares.

	##### Example
	###### resolve.server.config.js 
	```js
	export defualt {
	  extendExpress: (app) {
	    app.get('/custom', (req, res) => {
	      res.send('Custom page is rendered');
	    })
	  }
	}
	```

* #### initialState
	
	A function that takes a [query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query) and returns a Promise. It's possible to get an initial state by query to read-model and then resolve it with Promise. This state is used in the client and server `createStore` function.

	##### Example
	###### resolve.server.config.js
	```js
	export default {
	  initialState: async (query) => {
	    return await query('state');
	  }
	}
	```

* #### queries
	An array of [read models](#️-aggregates-and-read-models) for [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query). A *read model* represents the current state of a system or its part, and is built by processing all events happened to the system. Read models are used to answer queries.

	##### Example
	In this example, we import an array of read model objects specified in the `read-models.js` file. 
	###### resolve.server.config.js
	```js
	import readModels from './read-models'

	export default {
	  queries: readModels
	}
	```

* #### storage
	Contains an object with the following structure: 
	* `driver`: one of [storage drivers](https://github.com/reimagined/resolve/tree/master/packages/storage-drivers) 
	* `params`: config that will be passed to a driver when it is initialized

	##### Example
	###### resolve.server.config.js
	```js
	import storageDriver from 'resolve-storage-file';

	export default {
	  storage: {
	    driver: storageDriver ,
	    params: {
	      pathToFile: 'db.json'
	    }
	  }
	}
	```

### Build config
The `resolve.build.config.js` file contains information for building application.

* #### extendWebpack
	
	Allows to extend the standard reSolve client and server configs.

	##### Example
	###### resolve.build.config
	```js
	import webpack from 'webpack'

	export default {
	  extendWebpack: (clientConfig, serverConfig) => {
	    clientConfig.plugins.push(new webpack.DefinePlugin({
	      'customVarDefined': true    
		})
	  }
	}
	```

## **🛠 Environment Variables**

### Environment Variables to Change URL
You can adjust your application URL ([http://localhost:3000](http://localhost:3000/) is used by default) using the following environment variables:
* `HOST` - Set the IP address
* `PORT` - Set the port
*  `HTTPS` - Set to `true` to use `https` instead of `http`
* `ROOT_DIR` - Set the application's root directory. For example, `export ROOT_DIR=/newurl`. After that the application will be available on [http://localhost:3000/newurl](http://localhost:3000/newurl). 

Environment variables are available on the client side by  `process.env.VARIABLE_NAME`.


### Custom Environment Variables
You can pass custom env variables to the client side. To do this, name a variable starting with the `RESOLVE_` prefix. After that, this variable will be available on the client and server side via the `process.env` object .
