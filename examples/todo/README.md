# Example: Todo
**Todo** is simple demo application representing two-level the todo list realized by means of Resolve on the principles of EventSoucring.

Unlike the simplest linear todo list, the current example provides distribution of todos by cards. It can serve as the useful starting point for application programming with several types of the aggregates connected among themselves. Demo application consists of the partitioned servery and client part, including the general *isomorphic code* for *aggregates* and *read-models*. It shows how it is correct to select a common part of a code and also to use means of Resolve for the simplified client server interaction by means of **resolve-redux**.

The example includes the offered method of the functional testing of the web applications realized on **resolve** - by means of **Testcafe**. All source code and the functional tests are completely written in the **ES2016** language.

**Important node**. This demo example does NOT use **resolve-boilerplate**, and performs interaction with resolve backend directly by **socket.io**. It can be useful while writing own application with custom and possible complex client-server interaction.


The exhaustive description of the subject technologies and articles for them is provided here: [https://github.com/markerikson/react-redux-links](https://github.com/markerikson/react-redux-links).

## Quick start

To start, run next commands in terminal:
```
git clone https://github.com/reimagined/resolve
cd resolve
npm install && npm run bootstrap
cd examples/todo
npm start

```
After that open [http://localhost:3000](http://localhost:3000) in a browser to see app.

## Folder Structure

| ​Path ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​​ ​ ​ ​ ​ ​| Description                                                                                         |
| -----------------------------| --------------------------------------------------------------------------------------------------- |
| `todo/                     ` | root directory of current example application, presented as lerna mono-repository                   |
| `​ ​ ​client/                 ` | client/browser side part, based on create-react-app and presented as independent npm package [1, 2] |
| `​ ​ ​ ​ ​public/               ` | hosted static content [3]                                                                           |
| `​ ​ ​ ​ ​src/                  ` | soucre code of client react application [1, 2]                                                      |
| `​ ​ ​ ​ ​package.json          ` | description of current npm package                                                                  |
| `​ ​ ​common/                 ` | common isomorphic part, presented as independent npm package                                        |
| `​ ​ ​ ​ ​src/                  ` | isomorphic source code of aggregates & read model                                                   |
| `​ ​ ​ ​ ​ ​ ​aggregates/         ` | directory with isomorphic aggregate/action creators definitions [4, 5]                              |
| `​ ​ ​ ​ ​ ​ ​ ​ ​index.js          ` | entry point for exported aggregates                                                                 |
| `​ ​ ​ ​ ​ ​ ​ ​ ​TodoCard.js       ` | domain logic/command handlers for todo-card aggregate, which consists of todo-items                 |
| `​ ​ ​ ​ ​ ​ ​ ​ ​TodoItem.js       ` | domain logic/command handlers for one plain todo-item, which aggregates into card                   |
| `​ ​ ​ ​ ​ ​ ​read-models/        ` | directory with isomorphic read-models/reducers definitions [6, 7]                                   |
| `​ ​ ​ ​ ​ ​ ​ ​ ​cards.js          ` | read-model builder for todo-cards and it's todo-items, equalent to isomorphic reducer for browser   |
| `​ ​ ​ ​ ​ ​ ​ ​ ​index.js          ` | entry point for exported read models                                                                |
| `​ ​ ​ ​ ​ ​ ​index.js            ` | main entry point for npm package, present for default export purposes                               |
| `​ ​ ​ ​ ​package.json          ` | description of current npm package                                                                  |
| `​ ​ ​server/                 ` | server/backend API part, presented as independent npm package                                       |
| `​ ​ ​testcafe/               ` | functional tests written in testcafe [9]                                                            |
| `​ ​ ​ ​ index.tests.js        ` | entry point for functional tests suite for browser side execution                                   |
| `​ ​ ​docker-compose.yml      ` | docker-composer declaration for launching todo app and testcafe together                            |
| `​ ​ ​Dockerfile              ` | docker image declaration for todo application based on apline-node                                  |
| `​ ​ ​index.js                ` | entry point to example for launching server and client parts                                        |
| `​ ​ package.json            ` | description of current npm package                                                                  |
| `​ ​ README.md               ` | this readme file                                                                                    |
| `​​ ​ testcafe_runner.js      ` | launcher for functional tests by testcafe on local machine                                          |
| `​ ​ ​testcafe.dockerfile     ` | docker image declaration for functional tests on testcafe                                           |


## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run test:e2e`

Runs functiontal (E2E) tests suite by Testcafe runner on local machine.
It's independent command, so you should not start application server or launch browser manually.
E2E tests will be open in default system browser, or you can specify custom browser by
**browser** command line argument.


## Supported Language Features and Polyfills

This project supports a superset of the latest JavaScript standard.<br>
In addition to [ES7](http://2ality.com/2016/01/ecmascript-2016.html) syntax features, it also supports:

* [Async/await](https://github.com/tc39/ecmascript-asyncawait) (ES2017).
* [Object Rest/Spread Properties](https://github.com/sebmarkbage/ecmascript-rest-spread) (stage 3 proposal).
* [JSX](https://facebook.github.io/react/docs/introducing-jsx.html) syntax.


## References
- [1] [Referent folder structure for React + Redux + Saga isomopthic web application](https://github.com/xkawi/react-universal-saga/tree/master/src)
- [2] [Articles about React/Redux technologies stack](https://github.com/markerikson/react-redux-links)
- [3] [Create-react-app public folder documentation](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#using-the-public-folder)
- [4] [Domain Logic and aggregate](http://cqrs.nu/tutorial/cs/02-domain-logic)
- [5] [Action creators in redux](http://redux.js.org/docs/basics/Actions.html)
- [6] [Read Models are about Queries](http://cqrs.nu/tutorial/cs/03-read-models)
- [7] [Reducers in redux](http://redux.js.org/docs/basics/Reducers.html)
- [9] [Using TestCafe for E2E testing](http://devexpress.github.io/testcafe/documentation/using-testcafe/)
