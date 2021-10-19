# **Create reSolve App** 🚀

[![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app)

This package creates an empty reSolve application. Use the `--example` option to create an application based on an example or template project. ReSolve applications comply with the CQRS and Event Sourcing principles and use [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) on the client side by default.

**Create reSolve App** allows you to specify application blocks (aggregates, read models, and UI elements (React components)) in a semi-declarative manner. The `@resolve-js/scripts` package deploys API backend and domain services to interact with the client. The `@resolve-js/redux` package automates the client-server interaction.

Refer to the [React/Redux Links](https://github.com/markerikson/react-redux-links) document for details on subject-related technologies and links to the corresponding resources.

- [Getting Started](#getting-started) - How to create a new app
- [User Guide](#user-guide) - Information on apps created with the Create reSolve App

Available options:

- `--example <folder>` - create an application based on an [example](https://github.com/reimagined/resolve/tree/master/examples) or [project template](https://github.com/reimagined/resolve/tree/master/templates). The default is the [`react`](https://github.com/reimagined/resolve/tree/master/templates/js/react) template project.
- `--branch <branch>` or `--commit <sha>` - use the example code from the specific branch or commit.
- `--typescript` or `-t` - create a TypeScript project.
- `--version` or `-V` - show the version number.

## **Quick Overview** 🔎

> Note: Installing a package globally may require administrative privileges. This means you have to use the `sudo` command for Unix-based systems or run a terminal with administrative privileges on Windows systems.

```sh
npm i -g create-resolve-app
create-resolve-app my-resolve-app
cd my-resolve-app
npm run dev
```

![Terminal](https://user-images.githubusercontent.com/15689049/29822549-8513584c-8cd4-11e7-8b65-b88fdad7e4d1.png)

After that, your app (the `http://localhost:3000/` URL) opens in the default browser.

## **Getting Started**

### Create an App

Create a new reSolve application in one of the following ways:

- `yarn`:

  ```sh
  yarn create resolve-app my-resolve-app
  ```

- `npx`:

  ```sh
  npx create-resolve-app my-resolve-app
  ```

- `npm`:
  ```bash
  npm i -g create-resolve-app
  create-resolve-app my-resolve-app
  ```

This creates the `my-resolve-app` directory in the current directory and places your new app into it.

### Available Scripts 📋

#### Run in the Development Mode

Once the installation completes, you can start your app by running `npm run dev` or `yarn dev` in your application directory.

This runs the app in the development mode.
Open the http://localhost:3000 URL to view it in your default browser.

The page reloads as you edit source code files.
All errors appear in the console.

#### Build and Optimize for Production

The `npm run build` or `yarn build` command builds the client and server bundles for production using Webpack.

Building is performed in the `NODE_ENV === 'production'` [mode](https://webpack.js.org/guides/production/#node-environment-variable), so the build is optimized.

The HTTP server for the serving client bundle and assets is not included.

#### Run the App From the Build Directory

`npm start` or `yarn start`

#### Run Unit Tests with Jest

`npm test` or `yarn test`

#### Run Functional Tests with TestCafe

`npm run test:functional` or `yarn test:functional`

## **User Guide**

- [Project Structure Overview](../../docs/API%20References.md/#project-structure-overview)
- [JSON Schema ReSolve Config](../../tools/scripts/configs/schema.resolve.config.json)
- [Aggregate](../../docs/Aggregate.md)
- [View Model](../../docs/View%20Model.md)
- [Read Model](../../docs/Read%20Model.md)

The `resolve-create-app` script adds a copy of the User Guide to your project folder as the `README.md` file.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-create-resolve-app-readme?pixel)
