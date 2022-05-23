### Creating a new app with an example code

This folder contains example projects implemented with reSolve. You can use them to study various use-case scenarios or as templates for new reSolve applications.

The following example projects are available:

| Example Name                                                                                                                   | Description                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/ts/shopping-list)                                   | Demonstrates how to work with Read Models and View Models.                                              |
| [shopping-list-redux](https://github.com/reimagined/resolve/tree/master/examples/ts/shopping-list-redux)             | Demonstrates how to use the **@resolve-js/react-hooks** client library to communicate with the backend. |
| [shopping-list-redux-hoc](https://github.com/reimagined/resolve/tree/master/examples/ts/shopping-list-redux-hoc) | Demonstrates how to use the **@resolve-js/redux** library's hooks to communicate with the backend.      |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/ts/hacker-news)                                       | A clone of the [HackerNews](https://news.ycombinator.com/) application implemented using reSolve.       |
| [personal-data](https://github.com/reimagined/resolve/tree/master/examples/ts/personal-data)                                   | Demonstrates how to store encrypted personal data.                                                      |

You can create a new application based on example code using the `create-resolve-app` command with the `-e` flag followed by an example name. Use the `create-resolve-app -h` command to list the available examples.

```sh
npx create-resolve-app resolve-example -e <example name>
```
