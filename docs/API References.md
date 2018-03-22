# API References

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

## 📑 **Table Of Contents**
* [Available Scripts](#-available-scripts)
* [Project Structure Overview](#️-project-structure-overview)
    * [Client](#-client)
    * [Common](#-common)
    * [Configuration](#-configuration)
    * [Functional tests](#-functional-tests)
* [Configuration Files](#-configuration-files)
    * [Client Config](#client-config)
    * [Server Config](#server-config)
    * [Build Config](#build-config)
* [Authorization](#authorization)
* [Environment Variables](#-environment-variables)
    * [URL Settings](#url-settings)
    * [Custom Environment Variables](#custom-environment-variables)

## **Available Scripts**

In the project directory, you can run:

### `npm run dev`
Runs the app in the development mode.

Two web servers are  started: one - for the frontend/UI part, based on the webpack-dev-server on the 3001 port by default, and another one - for the API backend part to provide API for reSolve endpoints, based on express on the 3000 port. Development servers provide all the required debugging capabilities, including [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) and [source maps](https://webpack.js.org/configuration/devtool/).

Open [http://localhost:3000](http://localhost:3000/) or http://<your_ip>:3000 to view the app in the browser (you can change your [url settings](#url-settings)).

### `npm run build`
Builds client and server bundles for production through Webpack.

Building is performed in the `NODE_ENV === 'production'` [mode](https://webpack.js.org/guides/production/#node-environment-variable), so the build is optimized. No additional HTTP server for the serving client bundle and assets are  built.

### `npm start`
Runs the built app in the production mode.

Open [http://localhost:3000](http://localhost:3000/) or http://<your_ip>:3000 to view it in the browser (you can change your [url settings](#url-settings).

### `npm run update [version]`
Updates all resolve packages to the latest version according to [semver](https://docs.npmjs.com/getting-started/semantic-versioning).
If the `version` argument is set, the command updates packages to the specified version.

## **Project Structure Overview**
[Create ReSolve App](https://www.npmjs.com/package/creat-resolve-app) is an NPM package referencing the latest [reSolve framework package](../..#) versions. It consists of the common isomorphic part which describes domain business logic and React components for the presentation. No implicit server part is needed - it is encapsulated in `resolve-scripts`, but can be customized using [config](#-configuration-files). The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html).

```
resolve-app/
  .gitignore
  .yarnrc
  LICENSE
  README.md
  package-lock.json
  package.json
  resolve.build.config.js
  resolve.client.config.js
  resolve.server.config.js
  client/
    components/
      App.js
    reducers/
      index.js
    store/
      index.js
    routes.js
  common/
    aggregates/
      index.js
    read-models/
      index.js
    view-models/
      index.js
  static/
    favicon.ico
  tests/
    unit/
      index.test.js
    functional/
      testcafe_runner.js
      index.test.js
```

### **Client**
The client side is located in the `client/` folder and exports two key endpoints: root React component and Redux store creator function. These client part entry points must be specified in the [resolve.client.config.js](#client-config) configuration file in the root directory.

Any customization (for example, adding routing or applying middleware or saga) can be performed by wrapping original UI entry points into subsidiary entities and specifying them in an appropriate config section. The following examples show how to use a react router as UI entry point.

### **Common**
The `common/` folder contains the application's isomorphic part which represents a business logic distributed between server and client in the same code. The domain logic is described in a reSolve-compatible format and appears in [aggregate](https://github.com/reimagined/resolve/blob/master/docs/Aggregate.md), [read model](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md) and [view model](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md) declarations.

### **Configuration**
Create ReSolve App provides declarative configuration instead of an imperative coding server-side part. The configuration allows you to customize the React client and server-side rendering, declare domain business logic regarding Event Sourcing with the reSolve library, and modify the development and production modes' webpack behavior.

The client side, server side, and building phase configuration are split into three segregated files:
* [resolve.client.config.js](#client-config)
* [resolve.server.config.js](#server-config)
* [resolve.build.config.js](#build-config)

This approach allows you to simplify including non-isomorphic code and third-party libraries into an application by separating dependencies, and also store all ES5 code for the building phase in only one file.

### **Functional-tests**
The system's operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates UI interaction. After you modify the code, start functional tests to check if everything works correctly.

## **Configuration Files**
### Client Config
The **resolve.client.config.js** file contains information for your application's client side. In this file, you can define an entry point component and implement redux store creation with the client side's initial state.

```js
// resolve.client.config.js

import routes from './client/routes'
import createStore from './client/store'

export default {
  routes,
  createStore
}
```

### Server Config
The **resolve.server.config.js** file contains information for the reSolve library.

```js
// resolve.server.config.js

import path from 'path'
import fileAdapter from 'resolve-storage-lite'
import busAdapter from 'resolve-bus-memory'
import aggregates from './common/aggregates'
import readModels from './common/read-models'
import viewModels from './common/view-models'
import clientConfig from './resolve.client.config.js'

if (module.hot) {
  module.hot.accept()
}

const { NODE_ENV = 'development' } = process.env
const dbPath = path.join(__dirname, `${NODE_ENV}.db`)

export default {
  entries: clientConfig,
  bus: { adapter: busAdapter },
  storage: {
    adapter: fileAdapter,
    params: { pathToFile: dbPath }
  },
  initialState: () => ({}),
  aggregates,
  initialSubscribedEvents: { types: [], ids: [] },
  readModels,
  viewModels
}
```

### Build config
The **resolve.build.config.js** file contains information for building an application.

```js
// resolve.build.config

module.exports = {
  extendWebpack: (clientConfig, serverConfig) => {}
}
```

## **Authorization**

//todo

## **Environment Variables**

### URL Settings
You can adjust your application's URL ([http://localhost:3000](http://localhost:3000/) and http://<your_ip>:3000 is used by default) using the following environment variables:

* `HOST` - set the IP address;
* `PORT` - set the port;
* `HTTPS` - set to `true` to use `https` instead of `http`;
* `ROOT_DIR` - set the application's root directory. For example, `export ROOT_DIR=/newurl`. After that, the application is available at [http://localhost:3000/newurl](http://localhost:3000/newurl).

Environment variables are available on the client side using  `process.env.VARIABLE_NAME`.

### Custom Environment Variables
You can pass custom env variables to the client side. To do this, use the `RESOLVE_` prefix when naming a variable. After that, this variable is available on the client and server side via the `process.env` object.
