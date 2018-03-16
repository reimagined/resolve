
Here must be hello world tutorial - project structure, mandatory files/dirs, etc
Rest of this file must be transformed into Getting started in docs



# **🚀 ReSolve App**
This project is an application created with [Create ReSolve App](../../../create-resolve-app). This package creates an empty single page application by default or a typical Todo List application if you use the `--sample` option. This application is built on the CQRS and Event Sourcing principles using React+Redux on the client.

Create ReSolve App allows you to specify application blocks (aggregates, read models, and a UI part React components present) in a semi-declarative manner. With the `resolve-scripts` package, you do not need to write an API backend manually. Instead, `resolve-scripts` deploys backend and domain services to interact with the client which is wrapped into the `resolve-redux` package for an automated interaction.

Refer to [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links) for detailed information on subject-related technologies and links to the corresponding resources.

## **📑 Table of Contents**
* [Available Scripts](#-available-scripts)
    * [npm run dev](#npm-run-dev)
    * [npm run build](#npm-run-build)
    * [npm start](#npm-start)
    * [npm run update](#npm-run-update-[version])
* [Project Structure Overview](#️-project-structure-overview)
    * [Client](#-client)
    * [Common](#-common)
    * [Configuration](#-configuration)
    * [Functional tests](#-functional-tests)
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
        * [jwt](#jwt)
          * [cookieName](#jwtcookiename)
          * [options](#jwtoptions)
          * [secret](#jwtsecret)
        * [auth](#auth)
          * [strategies](#authstrategies)
        * [initialState](#initialstate)
        * [readModels](#readModels)
        * [sagas](#sagas)
        * [storage](#storage)
    * [resolve-scripts-auth](#resolve-scripts-auth)
      * [localStrategy](#localStrategy)
      * [githubStrategy](#githubStrategy)
      * [googleStrategy](#googleStrategy)
    * [Build Config](#build-config)
        * [extendWebpack](#extendwebpack)
* [Environment Variables](#-environment-variables)
    * [Environment Variables to Change URL](#environment-variables-to-change-url)
    * [Custom Environment Variables](#custom-environment-variables)


## **📋 Available Scripts**
In the project directory, you can run:

### `npm run dev`
Runs the app in the development mode.

Two web servers are  started: one - for the frontend/UI part, based on the webpack-dev-server on the 3001 port by default, and another one - for the API backend part to provide API for reSolve endpoints, based on express on the 3000 port. Development servers provide all the required debugging capabilities, including [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) and [source maps](https://webpack.js.org/configuration/devtool/).

Open [http://localhost:3000](http://localhost:3000/) to view the app in the browser.

### `npm run build`
Builds client and server bundles for production through Webpack.

Building is performed in the `NODE_ENV === 'production'` [mode](https://webpack.js.org/guides/production/#node-environment-variable), so the build is optimized. No additional HTTP server for the serving client bundle and assets are  built.

### `npm start`
Runs the built app in the production mode.

Open [http://localhost:3000](http://localhost:3000/) to view it in the browser.

### `npm run update [version]`
Updates all resolve packages to the latest version according to [semver](https://docs.npmjs.com/getting-started/semantic-versioning).
If the `version` argument is set, the command updates packages to the specified version.

## **🗂️ Project Structure Overview**
[Create ReSolve App](https://www.npmjs.com/package/creat-resolve-app) is an NPM package referencing the latest [reSolve framework package](../../..) versions. It consists of the common isomorphic part which describes domain business logic and React components for the presentation. No implicit server part is needed - it is encapsulated in `resolve-scripts`, but can be customized using [config](#-configuration-files). The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html).

```
resolve-app/
  .flowconfig
  .gitignore
  LICENSE
  README.md
  package-lock.json
  package.json
  resolve.build.config.js
  resolve.client.config.js
  resolve.server.config.js
  client/
    actions/
    components/
    containers/
    reducers/
    store/
  common/
    aggregates/
    read-models/
      default/
  static/
    favicon.ico
  tests/
    unit/
      index.test.js
    functional/
      testcafe_runner.js
      index.test.js
```

### **🕴 Client**
The client side is located in the `client/` folder and exports two key endpoints: root React component and Redux store creator function. These client part entry points must be specified in the [resolve.client.config.js](#client-config) configuration file in the root directory.

Any customization (for example, adding routing or applying middleware or saga) can be performed by wrapping original UI entry points into subsidiary entities and specifying them in an appropriate config section. The following examples show how to use a react router as UI entry point:
* [react-router-2](../../../../examples/resolve-scripts-with-router-2)
* [react-router-4](../../../../examples/resolve-scripts-with-router-4)

### **🔗 Common**
The `common/` folder contains the application's isomorphic part which represents a business logic distributed between server and client in the same code. The domain logic is described in a reSolve-compatible format and appears in [aggregate and read model](#️-aggregates-and-read-models) declarations.

### **📝 Configuration**
Create ReSolve App provides declarative configuration instead of an imperative coding server-side part. The configuration allows you to customize the React client and server-side rendering, declare domain business logic regarding Event Sourcing with the reSolve library, and modify the development and production modes' webpack behavior.

The client side, server side, and building phase configuration are split into three segregated files:
* [resolve.client.config.js](#client-config)
* [resolve.server.config.js](#server-config)
* [resolve.build.config.js](#build-config)

This approach allows you to simplify including non-isomorphic code and third-party libraries into an application by separating dependencies, and also store all ES5 code for the building phase in only one file.

### **🚦 Functional-tests**
The system's operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates UI interaction. After you modify the code, start functional tests to check if everything works correctly.

## **🏗️ Aggregates and Read Models**
An application's common business/domain logic consists of aggregates and read models.
### **Aggregates**
An *aggregate* is responsible for a system's behavior and encapsulates business logic. It responses to commands, checks whether they can be executed and generates events to change a system's current status.

A typical aggregate structure:

```js
export default {
  name: 'AggregateName', // Aggregate name for command handler, the same as aggregateType
  initialState: {}, // Initial state (Bounded context) for every instance of this aggregate type
  projection: {
    Event1Happened: (state, event) => nextState,  // Update functions for the current aggregate instance
    Event2Happened: (state, event) => nextState   // for different event types
  },
  commands: {
    command1Name: (state, command) => generatedEvent, // Function which generates events depending
    command2Name: (state, command) => generatedEvent  // on the current state and argument list
  }
};
```

### **Read Models**
A *read model* provides a system's current state or a part of it in the given format. It is built by processing all events happened in the system.

Usually, a read model consists of two parts:
* Asynchronous projection functions to build some state.
* GraphQL schema and resolvers to access the state and transmit it to the client in the appropriate format.

The read model projection function has two arguments: a storage provider and GraphQL arguments. The storage provider is an abstract facade for read-only operations on a read model state. The GraphQL arguments are a set of variables which are passed to a GraphQL query from the client side. See [GraphQL Guide](http://graphql.org/learn/) for more information.

A read model name is used for launching an API facade on the web server at `/api/query/READ_MODEL_NAME`. Each read model should have its own name. If an application consists of only one read model without a name, it will be automatically renamed to `graphql` and will be available at `/api/query/graphql`. The launched facade works as a graphql endpoint accepting POST requests in the [appropriate format](http://graphql.org/learn/serving-over-http/#post-request).

A typical read model structure:

```js
export default {
  name: 'Messages', // Read model name
  projection: { // Projection functions
    MessageCreated: async (store, event) => { // Use default memory collection storage
      const messages = await store.collection('messages');

      await messages.insert({
        id: event.aggregateId,
        title: event.payload.title,
        content: event.payload.content
      });
    }
  },
  gqlSchema: // Specify a schema of client-side GraphQL queries to the read model via Query API */
    `type Message {
      id: ID!
      title: String
      content: String
    }
    type Query {
      MessageById(id: ID!): Message
    }
  `,
  gqlResolvers: { // GraphQL resolver functions
    MessageById: async (store, { id }) => {
      const messages = await store.collection('messages');

      return await messages.findOne({ id });
    }
  }
};
```

Some read models, called *view models*,  are sent to the client UI to be a part of a Redux app state. They are small enough to fit into memory and can be kept up to date in the browser. They are defined in a special isomorphic format, which allows them to be used on the client and server side.

A typical view model structure:

```js
export default {
  name: 'Todos', // View model name
  projection: {
    TodoCreated: (state, event) => nextState,  // Update functions for the current view model instance
    TodoRemoved: (state, event) => nextState   // for different event types
  }
  // This state results from the request to the query handler at the current moment
};
```

View models are also available via the facade at `/api/query/VIEW_MODEL_NAME` with a simple GET-query that supports two required parameters: `aggregateIds` and `eventTypes`. A typical query to a view model is `/api/query/VIEW_MODEL_NAME?aggregateIds=id1&aggregateIds=id2`. It builds the view model state for all events that relate to aggregates with `id1` or `id2`.

Note: Some Immutable wrapper for a state object is required to use view model declaration as a Redux reducer. We recommend using the [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) library. Keep in mind that incorrectly handling an immutable object may cause performance issues.



## **🎛 Configuration Files**
### Client Config
The *resolve.client.config.js* file contains information for your application's client side. In this file, you can define an entry point component and implement redux store creation with the client side's initial state.

* #### `rootComponent`
  Specifies a react component that is rendered as an application's root component.

  ##### Example
  In this example, we create a simple react component and set it as a root component that is shown on the application’s home page.

  ```js
  // resolve.client.config.js

  import React from 'react';

  export default {
    rootComponent: () => (<h1>Root Component</h1>)
  }
  ```

* #### createStore
  Takes the initial state from the server side (initialState defined in [resolve.server.config.js](#initialstate)) and returns a Redux store.

  ##### Example
  This example shows a simple `createStore` implementation.

  ```js
  // resolve.client.config.js

  import React from 'react';
  import { createStore } from 'redux';

  import reducers from './reducers';  // standard redux reducers

  export default {
    rootComponent: () => (<h1>Root Component</h1>),
    createStore: initialState => createStore(reducers, initialState)
  }
  ```

  **Note:** Standard redux store creation excludes passing the initialState from the server side.

### Server Config
The *resolve.server.config.js* file contains information for the reSolve library.

* #### aggregates
  Specifies an [aggregate](#️-aggregates-and-read-models) array for the [resolve-command](../../../resolve-command). Each command is addressed to a particular aggregate. When an aggregate receives a command, it performs this command and produces an event or returns an error if the command cannot be executed.

  ##### Example
  In this example, we import an aggregate object array specified in the *aggregates.js* file.

  ```js
  // resolve.server.config.js

  import aggregates from './aggregates';

  export default {
    aggregates
  }
  ```

* #### bus
  The bus is used to emit events. It is an object with the following structure
  * `adapter` - a [bus adapter](../../../bus-adapters)
  * `params` - a configuration that is passed to an adapter when it is initialized

  ##### Example
  ```js
  // resolve.server.config.js

  import busAdapter from 'resolve-bus-zmq';

  export default {
    bus: {
      adapter: busAdapter,
      params: {
        url: 'zmq_url'
      }
    }
  }
  ```

* #### entries

  It might be the same config as in *resolve.client.config.js*. However, it is also possible to pass different `rootComponent` or `createStore` to server and client sides. It can be helpful in some cases (for example, see [resolve-scripts with react-router v4](../../../../examples/resolve-scripts-with-router-4) and  [resolve-scripts with react-router v2](../../../../examples/resolve-scripts-with-router-2)) but be  careful when using this approach - it may cause issues with SSR.

  ##### Example
  ```js
  // resolve.server.config.js

  import clientConfig from './resolve.client.config';

  export default {
    entries: clientConfig
  }
  ```

* #### entries.createStore

  Takes the [initialState](#initialstate) function value and returns a Redux store.

  ##### Example
  This example shows a simple `createStore` implementation.

  ```js
  // resolve.server.config.js

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

  Specifies a react component that is rendered as an application's root component.

  ##### Example
  In this example, we create a simple react component and set it as a root component that is shown on the application’s home page.

  ```js
  // resolve.server.config.js

  import React from 'react';

  export default {
    entries: {
      rootComponent: () => (<h1>Root Component</h1>)
    }
  }
  ```

* #### entries.ssrMode

    Specifies the server-side rendering mode.

    ##### Possible values:

    * `'none'` (default) - disables server-side rendering;
    * `'production-only'` - enables server-side rendering only when `NODE_ENV` is `'production'`;
    * `'always'` - enables server-side rendering.

    ##### Example

    The example below shows how to enable server-side rendering in a production environment only.

    ```js
    // resolve.server.config.js

    export default {
      entries: {
        ssrMode: 'production-only'
      }
    }
    ```

* #### initialSubscribedEvents

  An initial list of events which should be sent to the client side after an SPA page has been loaded.
  The `initialSubscribedEvents` object consists of two event subscription management fields:
  - `types` - by event types;
  - `ids` - by aggregate identifiers.

  ##### Example
  ```js
  // resolve.server.config.js

  export default {
    initialSubscribedEvents: {
      types: ['EVENT_TYPE_1', 'EVENT_TYPE_2'],
      ids: ['AGGREGATE_ID_1', 'AGGREGATE_ID_2']
    }
  }
  ```

* #### filterSubscription
  A function that allows filtering requested event types and aggregate identifiers on the server side. It can be used for security purposes - to prevent custom client agents from sending requests to events. Use the `requestInfo` argument to segregate different client subscriptions.

  ##### Example
  ```js
  // resolve.server.config.js

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

* #### jwt
  * #### jwt.cookieName
    Name of HTTP-cookie field, which does contain JWT token. This name is used to retrieve an actual cookie from a client agent/browser, perform validation and pass the contained state to the command and query side as a security context.

    ##### Example
    ```js
    // resolve.server.config.js

    export default {
      jwt: {
        cookieName: 'JWT-cookie'
      }
    }
    ```

  * #### jwt.options
    Options for customizing a JWT verification mechanism, including maximum allowed tokens age, audience configuration, etc. Options are provided as an object which is directly passed to a verification function as `options` argument.
    See the [jwt.verify reference documentation](https://www.npmjs.com/package/jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) for more information.

      ##### Example
      ```js
      // resolve.server.config.js

      export default {
        jwt: {
          options: {
            maxAge: 1000 * 60 * 5 // 5 minutes
          }
        }
      }
    ```

  * #### jwt.secret
    A secret key used for signing and further JWT token verification, which have been retrieved from client agent/browser. The current configuration uses an HS256 algorithm to sign and verify JWT tokens.
    Ensure that the key length is adequate for safety to avoid brute-force attacks - usually, a key with a 32-byte length. Read about the [Importance of Using Strong Keys in Signing JWTs](https://auth0.com/blog/brute-forcing-hs256-is-possible-the-importance-of-using-strong-keys-to-sign-jwts/).

    ##### Example
      ```js
      // resolve.server.config.js

      export default {
        jwt: {
          secret: 'JWT-secret-with-length-almost-32-bytes-for-enought-security'
        }
      }
    ```

* #### auth
  * #### auth.strategies
    This section contains configurations for simple authentication. You can configure a server route and other options or create a custom authentication strategy. Read [resolve-scripts-auth](#resolve-scripts-auth) for more details.

    ##### Example
      ```js
      // resolve.server.config.js

      import { localStrategy, githubStrategy, googleStrategy } from 'resolve-scripts-auth'
      // ...
      export default {
      // ...
        auth: {
          strategies: [
            localStrategy(/* options */),
            githubStrategy(/* options */),
            googleStrategy(/* options */)
            // other strategies
          ]
        }
      // ...
      }
      ```

* #### initialState

  A function that takes a [query](../../../resolve-query) and returns a Promise. It is possible to get an initial state by querying a read model and then resolving it with Promise. This state is used in the client and server `createStore` function.

    ##### Example
  ```js
  // resolve.server.config.js

  export default {
    initialState: async (query) => {
      return await query('state');
    }
  }
  ```

* #### readModels
  A [read model](#️-aggregates-and-read-models) array for [resolve-query](../../../resolve-query). A *read model* represents the current system state or a part of it and is built by processing all events happened in the system. Read models are used to answer queries.

  ##### Example
  In this example, we import an array of read model objects specified in the *read-models.js* file.
  ```js
  // resolve.server.config.js

  import readModels from './read-models'

  export default {
    readModels
  }
  ```

* #### sagas
  An array of functions allowing you to subscribe to the specified events and then execute a command.

  ##### Example
  ```js
  // resolve.server.config.js

  export default {
    sagas: [({ subscribeByEventType, subscribeByAggregateId, queryExecutors, executeCommand }) => {
      // ...
    }]
  }
  ```

* #### storage
  Contains an object with the following structure:
  * `adapter` - a [storage adapter](../../../storage-adapters);
  * `params` - a configuration that is passed to an adapter when it is initialized.

  ##### Example
  ```js
  // resolve.server.config.js

  import storageAdapter from 'resolve-storage-lite';

  export default {
    storage: {
      adapter: storageAdapter,
      params: {
        pathToFile: 'storage.db'
      }
    }
  }
  ```

### resolve-scripts-auth
This virtual package provides [localStrategy](#localStrategy), [githubStrategy](#githubStrategy) and [googleStrategy](#googleStrategy).

A strategy's predefined options:

* `strategy: {...}` - specifies strategy's options;
* `routes: {...}` -  configures strategy's routing;
* `failureCallback: (error, redirect, { resolve, body }) => {...}` - this callback is used for handling an error. The default callback redirects to the `/login?error=...` page;
* `done` - this callback allows you to send notifications about errors or successful operations:
   * Call `done('My error message')` to notify a user about an error.
   * Call `done(null, myData)` to notify a user that an operation is completed successfully (it sets the 'jwt' value and redirects to the homepage).

#### Auth strategies

* #### localStrategy
  ```js
  localStrategy({
    strategy: {
      usernameField: 'username', // your usernameField name in a POST request
      passwordField: 'password', // your passwordField name in a POST request
      successRedirect: null
    },
    routes: {
      register: {
        path: '/register',
        method: 'post'
      },
      login: {
        path: '/login',
        method: 'post'
      }
    },
    registerCallback: ({ resolve, body }, username, password, done) => {
      // your code to register a new user
      // you need to call the 'done' callback to notify a user about an error or successful operation
    },
    loginCallback: ({ resolve, body }, username, password, done) => {
      // your code to implement a user login
      // you need to call the 'done' callback to notify a user about an error or successful operation
    },
    failureCallback // default behavior
  })
  ```

* #### githubStrategy
  ```js
  githubStrategy({
    strategy: {
      clientID: 'MyClientID',
      clientSecret: 'MyClientSecret',
      callbackURL: 'http://localhost:3000/auth/github/callback',
      successRedirect: null
    },
    routes: {
      auth: '/auth/github',
      callback: '/auth/github/callback'
    },
    authCallback: ({ resolve, body }, profile, done) => {
      // your code to authenticate a user
      // you need to call the 'done' callback to notify a user about an error or successful operation
    },
    failureCallback // default behavior
  })
  ```

* #### googleStrategy
  ```js
  googleStrategy({
    strategy: {
      clientID: 'MyClientID',
      clientSecret: 'MyClientSecret',
      callbackURL: 'http://localhost:3000/auth/google/callback',
      successRedirect: null
    },
    routes: {
      auth: '/auth/google',
      callback: '/auth/google/callback'
    },
    authCallback: ({ resolve, body }, profile, done) => {
      // your code to authenticate a user
      // you need to call the 'done' callback to notify a user about an error or successful operation
    },
    failureCallback // default behavior
  })
  ```

### Build config
The *resolve.build.config.js* file contains information for building an application.

* #### extendWebpack

  Allows extending the standard reSolve client and server configurations.

  ##### Example
  ```js
  // resolve.build.config

  import webpack from 'webpack'

  export default {
    extendWebpack: (clientConfig, serverConfig) => {
      clientConfig.plugins.push(new webpack.DefinePlugin({
        'customVarDefined': true
      }))
    }
  }
  ```

## **🛠 Environment Variables**

### Environment Variables to Change URL
You can adjust your application's URL ([http://localhost:3000](http://localhost:3000/) is used by default) using the following environment variables:

* `HOST` - set the IP address;
* `PORT` - set the port;
* `HTTPS` - set to `true` to use `https` instead of `http`;
* `ROOT_DIR` - set the application's root directory. For example, `export ROOT_DIR=/newurl`. After that, the application is available at [http://localhost:3000/newurl](http://localhost:3000/newurl).

Environment variables are available on the client side using  `process.env.VARIABLE_NAME`.


### Custom Environment Variables
You can pass custom env variables to the client side. To do this, use the `RESOLVE_` prefix when naming a variable. After that, this variable is available on the client and server side via the `process.env` object.