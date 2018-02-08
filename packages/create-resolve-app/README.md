

# **Create reSolve App** 🚀
[![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app)

This package creates an empty application based on the reSolve framework. Use the `--sample` option to create a single page application (SPA) which represents a typical Todo List. The application is built on the CQRS and Event Sourcing principles using [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) on the client.

Create reSolve App allows you to specify application blocks (aggregates, read models, and UI part React components present) in a semi-declarative manner. With the `resolve-scripts` package, you do not need to write an API backend manually. Instead, `resolve-scripts` deploys backend and domain services to interact with the client which is wrapped in the `resolve-redux` package for an automated interaction.

Refer to [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links) for detailed information on subject-related technologies and links to the corresponding resources.

* [Getting Started](#getting-started) - How to create a new app
* [User Guide](#user-guide) - Information on apps created with the Create reSolve App

Available options:

- `--sample` creates a single page application representing a typical Todo List
- `--version` or `-V` outputs the version number

## **Quick Overview** 🔎
> Note: Installing a package globally may require administrative privileges. This means you have to use the sudo command for Unix-based systems or run a terminal with administrative privileges on Windows systems.

```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
cd my-resolve-app
npm run dev
```
![Terminal](https://user-images.githubusercontent.com/15689049/29822549-8513584c-8cd4-11e7-8b65-b88fdad7e4d1.png)
Your app will be opened in the browser at [http://localhost:3000/](http://localhost:3000/).

## **Getting Started**
### Create an App
Create a new reSolve application in one of the following ways:

using yarn...  
```bash
yarn create resolve-app my-resolve-app
```
...or npx:  
```bash
npx create-resolve-app my-resolve-app
```
...or npm:  
```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
```
This creates the `my-resolve-app` directory in the current folder and generates the initial project structure in that directory:
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
    testcafe_runner.js
    e2e-tests/
      index.test.js
```

### Available Scripts 📋
Once the installation is completed, you can run the following commands in the project directory to start your app:

### `npm run dev`
Runs the app in the development mode.

Two web servers are  started: one - for the frontend/UI part, based on the webpack-dev-server on port 3001 by default, and another one - for the API backend part to provide the API for reSolve endpoints, based on express on port 3000. Development servers provide all the required debugging capabilities, including [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/) and [source maps](https://webpack.js.org/configuration/devtool/).

Open [http://localhost:3000](http://localhost:3000/) to view the app in the browser.

### `npm run build`
Builds client and server bundles for production through Webpack.

Building is performed in the `NODE_ENV === 'production'` [mode](https://webpack.js.org/guides/production/#node-environment-variable), so the build is optimized. No additional HTTP server for the serving client bundle and assets are  built.

### `npm start`
Runs the built app in the production mode.

Open [http://localhost:3000](http://localhost:3000/) to view it in the browser.

## **User Guide**
The User Guide provides detailed information on an application created with Create reSolve App:
* [Project Structure Overview](../resolve-scripts/src/template#project-structure-overview-)
* [Aggregates and Read Models](../resolve-scripts/src/template#aggregates-and-read-models-)
* [Configuration Files](../resolve-scripts/src/template#configuration-files-)

A copy of the user guide is added to your project folder as the `Readme.md` file.
