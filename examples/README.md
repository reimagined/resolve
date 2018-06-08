# Examples

## Installation

You can get a sample app using the `create-resolve-app` tool with the -e flag followed by an example name. Use the create-resolve-app -h command to list the available examples.

You can get a sample reSolve application using this command:

```bash
npx create-resolve-app todo-example -e todo
```

The created application is accessible using the http://localhost:3000/ and http://<your_ip>:3000 URLs (you can change your URL settings).

Instead of npx you can also use npm or yarn tools:

```bash
yarn create resolve-app todo-example -e todo
```
or

```bash
npm i -g create-resolve-app
create-resolve-app todo-example -e todo
```

## List of Examples

The `create-resolve-app` can is capable of creating the following apps:

| Example name | Description | Complexity |
| --- | --- | --- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world) | An empty app that can be used as a template for any reSolve application. | ⭐️ |
| [todo](https://github.com/reimagined/resolve/tree/master/examples/todo) | This example demonstrates how to work with the view-models. | ⭐️ |
| [with-postcss-modules](https://github.com/reimagined/resolve/tree/master/examples/with-postcss-modules) | This example demonstrates how to work with the postCSS. | ⭐️ |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components) | This example demonstrates how to work with the styled-components | ⭐️ |
| [todo-two-levels](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels) | This example demonstrates how to work with view-models in the all events subscription case | ⭐️⭐️ |
| [top-list](https://github.com/reimagined/resolve/tree/master/examples/top-list) | This example demonstrates how to update application state on external events unrelated to user actions. | ⭐️⭐️ |
| [with-authentication](https://github.com/reimagined/resolve/tree/master/examples/with-authentication) | It is a simple application shows resolve-auth package usage. | ⭐️⭐️ |
| [**hacker-news**](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) | This example demonstrates HackerNews application clone with CQRS and EventSoucring. | ⭐️⭐️ |


![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-index-readme?pixel)
