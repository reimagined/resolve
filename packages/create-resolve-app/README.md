
# **🚀 Create ReSolve App**
This package creates an application based on the reSolve framework. It is a single page application (SPA) which represents a typical Todo List. The application is built on the CQRS and Event Sourcing principles, with React+Redux on client.

Create ReSolve App allows you to specify application blocks (aggregates, read models and UI part presented by React components) in the semi-declarative manner. With the `resolve-scripts` package, you don't need to write an API backend manually. Instead, `resolve-scripts` deploys backend and domain services to interact with the client which is wrapped into the `resolve-redux` package for automate interaction.

You can find detailed information on subject-related technologies and links to the corresponding resources here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).

* [Getting Started](#️-getting-started) - How to create a new app
* [User Guide](#user-guide) - Information on apps created with Create ReSolve App

## **🔎 Quick Overview**
> Note: the package's global installation may require administrative privileges. That means you have to use the `sudo` command for unix-based systems or run terminal with administrative privileges on windows systems to install a package globally.

```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
cd my-resolve-app
npm run dev
```
![Terminal](https://user-images.githubusercontent.com/15689049/29822549-8513584c-8cd4-11e7-8b65-b88fdad7e4d1.png)
Your app will be opened in the browser at [http://localhost:3000/](http://localhost:3000/).

## **▶️ Getting Started**
### 🏗 Create an App
Create a new reSolve application in one of the following ways.

Use yarn:  
```bash
yarn create resolve-app my-resolve-app
```
or use npx:  
```bash
npx create-resolve-app my-resolve-app
```
or use npm:  
```bash
npm i -g create-resolve-app
create-resolve-app my-resolve-app
```
This will create the `my-resolve-app` directory in the current folder and generate the initial project structure in that directory:
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
    components/
    containers/
    reducers/
  common/
    aggregates/
    read-models/
    store/
  static/
  tests/
```
### 📋 Available Scripts
Once the installation is done, you can run the following commands in the project directory to start your app:

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

## **User Guide**
The User Guide provides detailed information on an application created with Create ReSolve App:
* [Project Structure Overview](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#️-project-structure-overview)
* [Aggregates and Read Models](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#️-aggregates-and-read-models)
* [Configuration Files](https://github.com/reimagined/resolve/tree/master/packages/resolve-scripts/src/template#-configuration-files)

This user guide copy is added to your project folder as the `Readme.md` file.
