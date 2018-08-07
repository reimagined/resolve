# API References

## 📑 **Table Of Contents**

- [Project Structure Overview](#project-structure-overview)
  - [Authentication](#authentication)
  - [Client](#client)
  - [Common](#common)
  - [Functional tests](#functional-tests)
- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)


## **Project Structure Overview**

[Create ReSolve App](https://www.npmjs.com/package/create-resolve-app) is an NPM package referencing the latest [reSolve framework package](https://github.com/reimagined/resolve/) versions. It consists of the common isomorphic part which describes domain business logic and React components for the presentation. No implicit server part is needed - it is encapsulated in `resolve-scripts`, but can be customized using [config](#configuration-files). The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html).

```
📁 resolve-app
    📄 .gitignore
    📄 .yarnrc
    📄 .babelrc
    📄 README.md
    📄 package.json
    📄 config.app.json
    📄 config.dev.json
    📄 config.prod.json
    📄 config.test_functional.json
    📄 jest.config.json
    📄 index.js
    📁 auth/
        📄 index.js
    📁 client/
        📁 components
        📁 containers
            📄 App.js
        📁 reducers
            📄 index.js
        📁 store
            📄 index.js
        📁 middlewares
            📄 index.js
        📄 routes.js
    📁 common
        📁 aggregates
            📄 aggregate-name.commands.js
            📄 aggregate-name.projection.js
        📁 read-models
            📄 read-model-name.projection.js
            📄 read-model-name.resolvers.js
        📁 view-models
            📄 view-model-name.projection.js
            📄 view-model-name.serialize_state.js
            📄 view-model-name.deserialize_state.js
        📁 sagas
            📄 index.js
    📁 static
        📄 favicon.ico
    📁 tests
        📁 unit
            📄 index.test.js
        📁 functional
            📄 index.test.js
```

### **Authentication**

The `auth` folder contains authentication strategies' code. You can choose this file location using `auth` section in `config.app.json` (see [with-authentication example](../examples/with-authentication/config.app.json))

### **Client**

The client side is located in the `client/` folder. File `routes.js` contains route configuration according to the specifications of [Route Configuration Shape](https://github.com/reacttraining/react-router/tree/master/packages/react-router-config#route-configuration-shape).

### **Common**

The `common/` folder contains the application's isomorphic part which represents a business logic distributed between server and client in the same code. The domain logic is described in a reSolve-compatible format and appears in [aggregate](https://github.com/reimagined/resolve/blob/master/docs/Aggregate.md), [read model](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md) and [view model](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md) declarations.

### **Functional-tests**

The system's operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates UI interaction. After you modify the code, start functional tests to check if everything works correctly.

## **Configuration**

Resolve-based application should be launched manually with custom config files, and Resolve provides functional entry points for build and run application within target mode. Launching facilities are managed by Resolve configuration object, which contains major information about building phase (read models, view models, aggregate, etc) and launching application (environment, root path, TCP port, etc).

The configuration allows you to customize the React client and server-side rendering, declare domain business logic regarding Event Sourcing with the reSolve library, and modify the development and production modes' webpack behavior.

By default resolve app folder has those config files:

* index.js
* congif.app.js
* congif.dev.js
* congif.prod.js
* congif.test_functional.js

JSON Schema ReSolve Config is available at [schema.resolve.config.json](../packages/core/resolve-scripts/configs/schema.resolve.config.json).

Default values for config sections can be accessed via `import { defaultResolveConfig } from 'resolve-scripts'`

Config examples can be found in `examples` directory. Most advanced config, including descriptions for custom reducers, shapshots, auth, etc can be found in [`hacker-news`](../examples/hacker-news) example in `index.js` file.

## Environment Variables

You can pass env variables to the client side. To do this, use the `RESOLVE_` prefix when naming a variable. After that, this variable is available on the client and server side via the `process.env` object.
