# Example: Todo
**Todo** is demo SPA web-application representing two-level todo list with distribution todos by task cards. Application build on the principles of CQRS & EventSoucring and based on **Resolve** framework. This application does NOT use **resolve-boilerplate**, and performs interaction with resolve backend directly by **socket.io**, and provides custom API backend server.

Current example is scalable application and can use custom amount of command and query handlers in segregated node.js processes, which perform interaction by **ZMQ** bus.

This example can be useful in following cases: for writing application with several types of the aggregates connected among themselves, or writing own application with custom and possible complex client-server interaction.

The exhaustive description of the subject technologies and articles for them is provided here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).

## Quick start
```bash
git clone https://github.com/reimagined/resolve
cd resolve
# If you using windows, following command should be run with Administrator privileges - it's Lerna issue and not resolve itself
npm install && npm run bootstrap
cd examples/todo
npm start

```
After that open [http://localhost:3000](http://localhost:3000) in a browser to see app.

## Project Infrastructure Overview

Todo example root directory is Lerna mono-repository and consists of three main packages: client, common and server, each of them linked with others by Lerna bootstrapping mechanism. Project also includes unit & E2E testing and deployment assets. All source code and the functional tests are completely written in the [ES2016](http://2ality.com/2016/01/ecmascript-2016.html) language.

### Client
Client side is represented by independent create-react-app boilerplate, and contains default structure with React + Redux + Saga based SPA web-application. This project starts with own Webpack-Dev-Server on 3001 port, and performs communication with backend through Proxying API and `resolve-redux` package.
More information provided here: https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md

### Common
Common folder contains isomorphic application part, which represents business logic, distributed between server and client in same code. Domain logic described in **resolve**-compatible format and appears in aggregates and read-model declarations. See the details in the relevant section below.

### Server
Server side consists of manually-configured **resolve** library and custom but compatible API service for front-end. On one side, server provides HTTP/Websocket API to interact with client part by **resolve-redux** format, and on other side it manually launches and configures several instances of aggregates and read-models and involves inter-process communication between them. See the details in the relevant section below.

### TestCafe
For check of operability of system the functional tests on the basis of [TestCafe](http://devexpress.github.io/testcafe/documentation/using-testcafe/) are assembled used. The test set which start application assembled is applied to demonstration application, open in the browser and automate interaction with the interface. If you modify a code, then start of the functional tests helps to check that everything works successfully.


## Writing aggregates and read-models
Common business/domain logic of application is consist of two parts - aggregates and read-models:
- The aggregate is responsible for a system behavior and encapsulation of business logic, including response to commands, check of a possibility of their application and change of a current status of system by means of generation of events.
- The read model provides a current system state or its parts in the given format, proceeding from the analysis of the event list which brought system to such state by projection function.

Aggregates and read models are located in their respective directories and defined in a special isomorphic format, which allows them to be used on the client and server side.
- At client side aggregates are transformed into Redux action creators, and read models - into Redux reducers.
- At server side aggregates and read-models applied directory in Resolve eventsoucring framework.

Structure of typical aggregate:
```js
export default {
    name: 'AggregateName', // Aggregate name for command handler, same as aggregateType
    initialState: Immutable({}), // Initial state (Bounded context) for every instance of this aggregate type
    eventHandlers: {
        Event1Happened: (state, event) => nextState,  // Update functions for current aggregate instance
        Event2Happened: (state, event) => nextState   // for every different event types
    },
    commands: {
        command1: (state, arguments) => generatedEvent, // Function which generate events dependent
        command2: (state, arguments) => generatedEvent  // on current state and argument list
    }
};
```

Structure of typical read-model:
```js
export default {
    name: 'ReadModelName', // Read-model name for query handler
    initialState: Immutable({}), // Initial state for instance of this read model
    eventHandlers: {
        Event1Happened: (state, event) => nextState,  // Update functions for current read-model instance
        Event2Happened: (state, event) => nextState   // for every different event types
    }
    // This state will be the result of the request to the query handler at current moment
```

**Note**: For successful usage read-model declaration as Redux reducer, it *should* use some Immutable wrapper for state object.
Recommended way is [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) library.
Remember that inaccurate handling of an immutable object can lead to serious performance issues.

## Writing custom backend API server for resolve
**Resolve** framework provides simple boilerplate out-of-box, which encapsulates backend API server and provides ability to write application just by declaration aggregates, read models and UI React components. Though it has some settings and opportunities for extension, it also has the known restrictions, for example, is executed in one one-flow process.

Writing custom API server consists of following steps: initialize resolve EventStore (**resolve-es** package), start node.js processes for aggregates (**resolve-command** package) and read models (**resolve-query** package), register URL routes for front-end side, and organize message passing between all spawned processes.

Stereotypical implementation of aggregate and read-model process can be found at `todo/server/command/index.js` and `todo/server/query/index.js`. Entry point, process manager and load balancer for them presented in `todo/server/index.js`, and inter-process communication channel in `todo/server/ipc.js`.

Due limitation of **resolve-query** package, each one read-model can't be split horizontally, e.g. take some subset and/or derivative of read-model state by some arguments. Every read model can be fully located on client and/or server or not present there at all.

By using two-direction web socket, resolve backend API can be exposed to client without dedicated route registration. Assuming that `requestReadModel` and `requestCommand` is functions, which provide message exchange to corresponding microservices, and `eventNames` is array of domain event that client application can understand, all interaction code can look like below.
```js
io.on('connection', socket => requestReadModel('INITIAL_READ_MODEL_NAME') // Poll main view model for front-end initial state
    .then(({ state }) => socket.emit('initialState', state)) // Pass fetched state to client
    .then(() => {
        socket.on( // Subscribe on socket `command`-messages to perform passing incoming commands from client to executor microsercice
            'command', command => requestCommand( // Send command and ensure aggregateId exists or create new for fresh aggregates
                Object.assign({}, command, { aggregateId: command.aggregateId || uuid.v4() })
            ).catch(err => console.log(err))
        );

        const unsubscribe = eventStore.onEvent( // Subscribe on supported domain events and translate them to connected client
            eventNames, event => socket.emit('event', event)
        );

        socket.on('disconnect', () => unsubscribe()); // Unsubscribe on client disconnect - for resource freeing
    })
);
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run test:e2e`

Runs functional (E2E) tests suite by Testcafe runner on local machine.
It's independent command, so you should not start application server or launch browser manually.
E2E tests will be open in default system browser, or you can specify custom browser by
**browser** command line argument.


