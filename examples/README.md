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

| Example name | Description | Complexity |
| --- | --- | --- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world) | An empty app that can be used as a template for any reSolve application. | ⭐️ |
| [todo](https://github.com/reimagined/resolve/tree/master/examples/todo) | This example demonstrates how to work with the [view-models](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md). | ⭐️ |
| [with-postcss-modules](https://github.com/reimagined/resolve/tree/master/examples/with-postcss-modules) | This example demonstrates how to work with the [postCSS](https://github.com/postcss/postcss-loader#css-modules). | ⭐️ |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components) | This example demonstrates how to work with the [styled-components](https://www.styled-components.com/docs). | ⭐️ |
| [todo-two-levels](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels) | This example demonstrates how to work with view-models in the all events subscription case | ⭐️⭐️ |
| [top-list](https://github.com/reimagined/resolve/tree/master/examples/top-list) | This example demonstrates how to update application state on external events unrelated to user actions. | ⭐️⭐️ |
| [with-authentication](https://github.com/reimagined/resolve/tree/master/examples/with-authentication) | It is a simple application shows [resolve-auth](https://github.com/reimagined/resolve/tree/master/packages/resolve-auth) package usage. | ⭐️⭐️ |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) | This example demonstrates [HackerNews](https://news.ycombinator.com/) application clone with CQRS and EventSoucring. | ⭐️⭐️️️️⭐️️️️ |


![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-index-readme?pixel)
