

# **Create reSolve App** 🚀
[![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app)

This package creates an empty application based on the reSolve framework ([`hello-world` example](https://github.com/reimagined/resolve/tree/master/examples/hello-world)). Use the `--example` option to create a single page application (SPA) based on another example. The application is built on the CQRS and Event Sourcing principles using [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) on the client.

Create reSolve App allows you to specify application blocks (aggregates, read models, and UI part React components present) in a semi-declarative manner. With the `resolve-scripts` package, you do not need to write an API backend manually. Instead, `resolve-scripts` deploys backend and domain services to interact with the client which is wrapped in the `resolve-redux` package for an automated interaction.

Refer to [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links) for detailed information on subject-related technologies and links to the corresponding resources.

* [Getting Started](#getting-started) - How to create a new app
* [User Guide](#user-guide) - Information on apps created with the Create reSolve App

Available options:

- `--example <folder>` creates appropriate application from examples folder in resolve repo. [`hello-world`](https://github.com/reimagined/resolve/tree/master/examples/hello-world) is default
- `--branch <branch>, --commit <sha>` - you can specify if you need example from specific brach or even commit
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
This creates the `my-resolve-app` directory in the current folder and generates the initial project from specified example.

### Available Scripts 📋
Once the installation is completed, you can run the following commands in the project directory to start your app:
 
### `npm run dev` or `yarn dev`
Runs the app in the development mode.
Open http://localhost:3000 to view it in the browser.
 
The page will reload if you make edits.
You will also see any errors in the console.
 
### `npm run build` or `yarn build`
Builds client and server bundles for production through Webpack.
 
Building is performed in the `NODE_ENV === 'production'` [mode](https://webpack.js.org/guides/production/#node-environment-variable), so the build is optimized. No additional HTTP server for the serving client bundle and assets are built.
 
### `npm start` or `yarn start`
Runs the app from the build directory.
 
### `npm test` or `yarn test`
Runs unit run tests with Jest.
 
### `npm run test:functional` or `yarn test:functional`
Runs functional tests with TestCafe.

## **User Guide**
The User Guide provides detailed information on an application created with Create reSolve App:
* [Project Structure Overview](../../examples/hello-world/#project-structure-overview-)
* [Aggregates and Read Models](../../examples/hello-world#aggregates-and-read-models-)
* [Configuration Files](../../examples/hello-world#configuration-files-)

A copy of the user guide is added to your project folder as the `Readme.md` file.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-create-resolve-app-readme?pixel)
