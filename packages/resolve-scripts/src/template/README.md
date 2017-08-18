# Resolve boilerplate

**Resolve boilerplate** is referent SPA web-application representing stereotypical Todo List example with React+Redux. Application build on the principles of CQRS & EventSoucring and based on **Resolve** framework.

Boilerplate provides ability for semi-declarative declaration of application blocks, including aggregates, read-models and UI part presented as React component. By using **resolve-scripts**, you don't need to write API backend manually. Instead, react-scripts will deploy backand and domain services for interact with client, which will be wrapped into **resolve-redux** package to automate interaction.

The exhaustive description of the subject technologies and articles for them is provided here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).

## Quick start
```bash
git clone https://github.com/reimagined/resolve-boilerplate myapp
cd myapp
npm install
npm run dev
```
After that open [http://localhost:3000](http://localhost:3000) in a browser to see app.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.

Two web-servers will be started: one for frontend/UI part, based on webpack-dev-server on 3001 port by default,
and one for API backend part, based on express on 3000 port and provides API for Resolve endpoints.
Development servers have enough debugging capabilities, including Hot Module Replacement and source maps.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run build`

Builds client & server bundles through Webpack for production mode.

Building performs in `NODE_ENV === 'production'` mode, so all available optimisation will be performed.
No additional http server for serving client bundle & assets will be build.

### `npm start`

Runs builded app in the production mode.

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.


## Project Structure Overview

Resolve-boilerplate presented as simple NPM package, which referenced to fresh versions of resolve framework packages.
Boilerplate consists of common isomorphic part, which describes domain business logic, and React component for presentation part. No implicit server part is needed, due be encapsulated in resolve-scripts, but can be customised by config.
Project also includes unit & E2E testing and deployment assets. All source code and the functional tests are completely written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html) language.

### Client
Client side located in the appropriate directory, and exported two key endpoints: root React component and Redux store creator function. These entry points to the client part must be specified in the configuration file `resolve.client.config.js`, located in root directory.

Any customization like adding routing or applying middleware or saga can be performed by proper wrapping original UI entry points into subsidiary entities and specifying them in appropriate config section.
Example applications using react-router as UI entry point for resolve-boilderpalte are available here: [Version 2](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-2) and [Version 4](https://github.com/reimagined/resolve/tree/master/examples/resolve-scripts-with-router-4).


### Common
Common folder contains isomorphic application part, which represents business logic, distributed between server and client in same code. Domain logic described in **resolve**-compatible format and appears in aggregates and read-model declarations.
See the details in [TodoList example](https://github.com/reimagined/resolve/blob/master/examples/todo/README.md#writing-aggregates-and-read-models).

### Configuration
Resolve-boilerplate provides declaration configuration instead of imperative coding server-side part. Config provides customizing for React client & server-side rendering, declaration for domain business logic in terms of Event Soucring with Resolve library, and modify webpack behaviour for development and production modes.

Config for client side, server side and building phase are splitted in three segregated files (`resolve.client.config.js`, `resolve.server.config.js` and `resolve.build.config.js` respectively). This approach allows you to simplify including non-isomorphic code and third-party libraries into application by separating dependencies, and also funnel all ES5 language code for building phase in only one file.
See the details in the [relevant section below](#configuration-files).


### E2E-tests
For check of operability of system the functional tests on the basis of [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) are assembled used. The test set which start application assembled is applied to demonstration application, open in the browser and automate interaction with the interface. If you modify a code, then start of the functional tests helps to check that everything works successfully.

## Configuration files
### resolve.client.config

This file contains information for client side of your application.

#### rootComponent
_ReactElement_

Contains root component that will be rendered on client side.

#### createStore
_function(initialState: Object): store_

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in [resolve.server.config.js](#initialstate)


### resolve.server.config

This file contains information for SSR and resolve library.

#### aggregates
_Array_

Array of aggregates for [resolve-command](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-command).


#### bus
_Object_

Contains config for [resolve-bus](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-bus).

#### entries

##### createStore
_function(initialState: Object): store_

Function that takes initialState and returns redux store. Initial state will be takken from server side and it defines in [resolve.server.config.js](#initialstate)

##### rootComponent
_ReactElement_

Contains root component that will be rendered on server side.

#### events
_Object_

List of events.

#### extendExpress
_function(req, res, next)_

It's possible to define there custom routes and write express middleware.

#### initialState
_function(query): Promise_

Function that takes a [query](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-query) and returns a Promise. It's possible to get initial state by query to read-model and then resolve it with Promise.

#### queries
_Array_

Array of read models for [resolve-query](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-query).

#### storage
_Object_

Contains config for [resolve-storage](https://github.com/reimagined/resolve/tree/resolve-scripts-readme/packages/resolve-storage).

### resolve.build.config

#### extendWebpack
_function(clientConfig, sererConfig)_

It's a function where is possible to extend standart resolve client and server configs.
See details at [Webpack configuration guide](https://webpack.js.org/configuration/).

## Environment variables

### ROOT_DIR

To change root directory of an application set the environment variable ROOT_DIR to needed value. For example `export ROOT_DIR=/newurl`. After that application will be available by `http://localhost:3000/newurl`. ROOT_DIR variable will be available on client side by `process.env.ROOT_DIR`.

### Custom variables

It is possible to pass env variable to client side. For this define variable with `RESOLVE_` prefix. After that variable will be available on client and on server side by `process.env`.
