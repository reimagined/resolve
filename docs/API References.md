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

[Create reSolve App](https://www.npmjs.com/package/create-resolve-app) is an [NPM](https://www.npmjs.com/) package used to prepare the file structure for a new reSolve-based application. The package corresponds to the latest [reSolve framework package](https://github.com/reimagined/resolve/) version.

The server-side reSolve part is encapsulated in the `resolve-scripts` package and can be customized using [configuration files](#configuration-files). The project also includes unit and functional tests, and deployment assets. We use [ES2016](http://2ality.com/2016/01/ecmascript-2016.html) for source code and tests.

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

The `auth` folder contains the code of authentication strategies. You can change this folder's path using the `auth` section in `config.app.json` (see [hacker-news example](../examples/hacker-news/config.app.json))

### **Client**

The client-side reSolve part is located in the `client` folder. The `routes.js` file contains routes configuration according to the [Route Configuration Shape](https://github.com/reacttraining/react-router/tree/master/packages/react-router-config#route-configuration-shape) specification.

### **Common**

The `common` folder contains the application's isomorphic part, which represents a business logic distributed between the server and client. The domain logic is described in a reSolve-specific format and appears in [Aggregates](https://github.com/reimagined/resolve/blob/master/docs/Aggregate.md), [Read Models](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md), and [View Models](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md) declarations.

### **Functional-tests**

[TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests control the system's operability. A test suite builds and starts a demo application, opens it in a browser and automatically performs UI interaction. After you modify the code, run functional tests to ensure that everything works correctly.

## **Configuration**

A reSolve configuration file allows you to customize [many aspects](../packages/core/resolve-scripts/configs/schema.resolve.config.json) of the framework behavior.

The newly-created reSolve app contains the following configuration files:

* `index.js`
* `congif.app.js`
* `congif.dev.js`
* `congif.prod.js`
* `congif.test_functional.js`

The reSolve configuration files' JSON Schema is available in [schema.resolve.config.json](../packages/core/resolve-scripts/configs/schema.resolve.config.json).

The default configuration is available in the `defaultResolveConfig` object from the [resolve-scripts](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-scripts).

## Environment Variables

You can pass environment variables to the application. Use the `RESOLVE_` prefix in a variable name to make this variable available on the client and server side via the `process.env` object.
