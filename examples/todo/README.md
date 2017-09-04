# **ReSolve Todo Example**
This project is a demo single page application representing a two-level todo list with todo-items grouped by task cards. The application is built on the CQRS and Event Sourcing principles and based on the reSolve framework. This application does NOT use [
Create ReSolve App](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app). It performs interaction with reSolve backend directly by socket.io and provides a [custom API backend server](#custom-backend-api-server-for-resolve).

The current example is a scalable application and can use custom amount of command and query handlers in segregated node.js processes, which perform interaction by ZMQ bus.

So, this example can be useful if you develop an application:
* with several aggregate types related to each other
* with custom and complex client-server interaction

You can find detailed information on subject-related technologies and links to the corresponding resources here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).

## **Table of Contents**
* [Quick Start](#quick-start)
* [Available Scripts](#available-scripts)
    * [npm start](#npm-start)
    * [npm run test:e2e](#npm-run-teste2e)
* [Project Structure Overview](#project-structure-overview)
    * [Client](#client)
    * [Common](#common)
    * [Server](#server)
    * [TestCafe](#testcafe)
* [Aggregates and Read Models](#aggregates-and-read-models)
* [Custom Backend API Server for ReSolve](#custom-backend-api-server-for-resolve)

## **Quick Start**
```bash
git clone https://github.com/reimagined/resolve
cd resolve
npm install && npm run bootstrap
cd examples/todo
npm start
```

Then open [http://localhost:3000](http://localhost:3000/) in your browser to see the app.

**Note:** When using Windows, run commands above with administrative privileges.

## **Available Scripts**
In the project directory, you can run:

### `npm start`
Runs the app in the development mode.

Open [http://localhost:3000](http://localhost:3000/) to view it in the browser.

### `npm run test:e2e`
Runs functional (E2E) tests suite by [Testcafe](http://devexpress.github.io/testcafe/) runner on a local machine. It's an independent command, so you should not start application server or launch browser manually. E2E tests will be open in default system browser, or you can specify custom browser by browser command line argument.

## **Project Structure Overview**
This project’s root directory is a [Lerna mono-repository](https://lernajs.io/). It consists of three main packages: client, common and server. 

These packages are linked to each other by the Lerna bootstrapping mechanism. The project also includes unit & E2E testing and deployment assets. All source code and functional tests are written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html) language.

### **Client**
The client side is built with [create-react-app](https://github.com/facebookincubator/create-react-app), and has a structure default for a [React](https://github.com/facebook/react) + [Redux](https://github.com/reactjs/redux) + [Saga](https://github.com/redux-saga/redux-saga) based single-page web-application. This project starts with own [Webpack-Dev-Server](https://webpack.js.org/configuration/dev-server/) on the 3001 port, and communicates with the backend through [Proxying API](https://github.com/facebookincubator/create-react-app/tree/master/packages/react-scripts/template#proxying-api-requests-in-development) and the [resolve-redux](https://www.npmjs.com/package/resolve-redux) package.

### **Common**
The `common/` folder contains isomorphic application part, which represents business logic distributed between server and client in the same code. Domain logic is described in a **resolve**-compatible format and appears in aggregate and read model declarations.

### **Server**
The server side consists of the manually-configured **resolve** library and custom but compatible API service for front-end. On the one side, the server provides HTTP/Websocket API to interact with the client part in the **resolve-redux** format. On the other side, it manually launches and configures several instances of aggregates and read models and involves inter-process communication between them. See the [Custom Backend API Server for reSolve](#custom-backend-api-server-for-resolve) section for details.

### **TestCafe**
The system operability is controlled with [TestCafe](http://devexpress.github.io/testcafe/) functional tests. A test set builds and starts a demonstration application, opens it in a browser and automates interaction with UI. After you modify code, start functional tests  to check whether everything works successfully. 

## **Aggregates and Read Models**
The current example contains two aggregates (`TodoCard`, `TodoItem`) and one read model (`cards`), which are defined in the `common/aggregates` and `common/read-models` folders, respectively.

The `TodoItem` aggregate represents a task with text description, a flag indicating the task state (‘todo’ or ‘done’), and unique identifier. The `TodoCard` aggregate  contains a list of `TodoItem`-s grouped in one logical set. 

The `cards` read model assembles TodoItems grouped by TodoCards in one general associative array, and includes each task item description and state. Also, this read model builds inverse lookup table to allow fast search for the `TodoCard` container by `TodoItem`’s identifier.

For more detailed information on aggregates and read models, refer to [Create ReSolve App](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) documentation.

## **Custom Backend API Server for ReSolve**
[Create ReSolve App](https://github.com/reimagined/resolve/tree/master/packages/create-resolve-app) provides a simple application out-of-the-box, which encapsulates backend API server and allows you to create an application just by declaring aggregates, read models and UI React components. Though it has some settings and opportunities for extension, it also has the known restrictions - for example, it is executed in one single-threaded
 process. This Todo example demonstrates how to implement a custom API server. To do this, follow the steps below: 
* initialize reSolve EventStore (the `resolve-es` package)
* start node.js processes for aggregates (the `resolve-command` package) and read models (the `resolve-query` package)
* register URL routes for the front-end side
* organize messaging between all spawned processes

So, this example’s `server/` directory includes:
* `command/index.js` and `query/index.js` - implementation of aggregate and read model processes	
* `index.js` -  entry point, process manager and load balancer for processes
* `ipc.js` -  inter-process communication channel


Due to the `resolve-query` package’s limitations, a read model can’t be split horizontally – a part of a read model state can’t be accessed by some arguments. A read model can be fully located on the client and/or server or not present there at all.

reSolve backend API can be exposed to a client without route registration as it uses two-direction web socket. Assume that  `requestReadModel` and `requestCommand` are functions providing message exchange between corresponding microservices, and `eventNames` is an array of domain events which the client application can understand, then all interaction code can look like this.

```js
io.on('connection', socket => requestReadModel('INITIAL_READ_MODEL_NAME') // Poll the main view model for front-end initial state
    .then(({ state }) => socket.emit('initialState', state)) // Pass the fetched state to the client
    .then(() => {
        socket.on( // Subscribe to socket `command`-messages to pass incoming commands from the client to executor microservice
            'command', command => requestCommand( // Send a command and ensure that aggregateId exists. Otherwise, create a new aggregate
                Object.assign({}, command, { aggregateId: command.aggregateId || uuid.v4() })
            ).catch(err => console.log(err))
        );

        const unsubscribe = eventStore.subscribeByEventType( // Subscribe to supported domain events and translate them to the connected client
            eventNames, event => socket.emit('event', event), true
        );

        socket.on('disconnect', () => unsubscribe()); // Unsubscribe when the client is disconnected to free resources
    })
);
```
