# Examples

## Installation

You can get a sample app using the `create-resolve-app` tool with the `-e` flag followed by an example name:

```sh
npx create-resolve-app resolve-todo-example -e todo
```

Use the `create-resolve-app -h` command to list the available examples.

The created application is accessible using the `http://localhost:3000/` and `http://<your_ip>:3000` URLs (you can change this in [resolve.config.json](https://github.com/reimagined/resolve/blob/master/packages/core/resolve-scripts/configs/resolve.config.json)).

You can also use `npm` or `yarn` instead of `npx`:

```sh
yarn create resolve-app resolve-todo-example -e todo
```

or

```sh
npm i -g create-resolve-app
create-resolve-app resolve-todo-example -e todo
```

## Examples List

| Example name | Description | Complexity |
| --- | --- | --- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world) | An empty app used as a template for a reSolve application. | ⭐️ |
| [todo](https://github.com/reimagined/resolve/tree/master/examples/todo) | Shows how to work with [View Models](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md). | ⭐️ |
| [with-postcss](https://github.com/reimagined/resolve/tree/master/examples/with-postcss) | Shows how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules). | ⭐️ |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components) | Shows how to work with [Styled Components](https://www.styled-components.com/docs). | ⭐️ |
| [todo-two-levels](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels) | Shows how to work with View Models in the **all events subscription** case | ⭐️⭐️ |
| [top-list](https://github.com/reimagined/resolve/tree/master/examples/top-list) | Shows how to update the application state on external events unrelated to user actions. | ⭐️⭐️ |
| [with-authentication](https://github.com/reimagined/resolve/tree/master/examples/with-authentication) | Allows [resolve-auth](https://github.com/reimagined/resolve/tree/master/packages/core/resolve-auth) package usage. | ⭐️⭐️ |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) | The [HackerNews](https://news.ycombinator.com/) application clone with CQRS and EventSoucing. | ⭐️⭐️️️️⭐️️️️ |


![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-index-readme?pixel)
