# API References

## 📑 **Table Of Contents**
* [Available Scripts](#available-scripts)
* [Project Structure Overview](#️project-structure-overview)
    * [Client](#client)
    * [Common](#common)
    * [Configuration](#configuration)
    * [Functional tests](#functional-tests)
* [Configuration Files](#configuration-files)
    * [Client Config](#client-config)
    * [Server Config](#server-config)
    * [Build Config](#build-config)
* [Authentication](#authentication)
* [Environment Variables](#environment-variables)
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

## **Project Structure Overview**
[Create ReSolve App](https://www.npmjs.com/package/creat-resolve-app) is an NPM package referencing the latest [reSolve framework package](../..#) versions. It consists of the common isomorphic part which describes domain business logic and React components for the presentation. No implicit server part is needed - it is encapsulated in `resolve-scripts`, but can be customized using [config](#-configuration-files). The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html).

```
📁 resolve-app
    📄 .gitignore
    📄 .yarnrc
    📄 LICENSE
    📄 README.md
    📄 package.json
    📄 resolve.config.json
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
        📄 routes.js
    📁 common
        📁 aggregates
            📄 firstAggregate.commands.js
        📁 read-models
            📄 firstReadModel.projection.js
            📄 firstReadModel.resolvers.js
        📁 view-models
            📄 firstViewModel.projection.js
    📁 static
        📄 favicon.ico
    📁 tests
        📁 unit
            📄 index.test.js
        📁 functional
            📄 index.test.js
```

### **Authentication**
The `auth` folder contains authentication strategies' code. You can choose this file location using `auth` section in `resolve.config.json` (see [auth example](../examples/with-authentication/resolve.config.json))

### **Client**
The client side is located in the `client/` folder. File `routes.js` contains route configuration according to the specifications of [Route Configuration Shape](https://github.com/reacttraining/react-router/tree/master/packages/react-router-config#route-configuration-shape).

### **Common**
The `common/` folder contains the application's isomorphic part which represents a business logic distributed between server and client in the same code. The domain logic is described in a reSolve-compatible format and appears in [aggregate](https://github.com/reimagined/resolve/blob/master/docs/Aggregate.md), [read model](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md) and [view model](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md) declarations.

### **Functional-tests**
The system's operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates UI interaction. After you modify the code, start functional tests to check if everything works correctly.

## **Configuration Files**
Create ReSolve App provides declarative configuration instead of an imperative coding server-side part. The configuration allows you to customize the React client and server-side rendering, declare domain business logic regarding Event Sourcing with the reSolve library, and modify the development and production modes' webpack behavior.

The general and building phase configuration are split into two segregated files:
* [resolve.config.json](#resolve-config)
* [resolve.build.config.js](#build-config)

### Resolve Config

JSON Schema ReSolve Config is available at [schema.resolve.config.json](../packages/resolve-scripts/configs/schema.resolve.config.json).

Default values for config sections are available at [resolve.config.json](../packages/resolve-scripts/configs/resolve.config.json). If there is no application-based `resolve.config.json` supplied, default values from this file will be used.

Config examples can be found in `examples` directory. Most advanced config, including descriptions for custom reducers, shapshots, auth, etc can be found in [`hacker-news`](../examples/hacker-news) example.

### Build config
The **resolve.build.config.js** file contains information for building an application.

```js
// resolve.build.config

export default (webpackConfigs, { resolveConfig, deployOptions, env }) => {

}
```

Example can be found in [`with-postcss-modules`](../examples/with-postcss-modules) example

## Environment Variables
You can pass env variables to the client side. To do this, use the `RESOLVE_` prefix when naming a variable. After that, this variable is available on the client and server side via the `process.env` object.
