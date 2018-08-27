# Examples

## Installation

You can get a sample app using the `create-resolve-app` tool with the `-e` flag followed by an example name:

```sh
npx create-resolve-app resolve-nested-list-example -e nested-list
```

Use the `create-resolve-app -h` command to list the available examples.

The created application is accessible using the `http://localhost:3000/` and `http://<your_ip>:3000` URLs (you can change this in [configuration files](https://github.com/reimagined/resolve/blob/dev/packages/core/resolve-scripts/configs/schema.resolve.config.json)).

You can also use `npm` or `yarn` instead of `npx`:

```sh
yarn create resolve-app resolve-nested-list-example -e nested-list
```

or

```sh
npm i -g create-resolve-app
create-resolve-app resolve-nested-list-example -e nested-list
```

## Examples List

| Example name | Description | Complexity |
| --- | --- | --- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world) | An empty app used as a template for a reSolve application. | ⭐️ |
| [with-postcss](https://github.com/reimagined/resolve/tree/master/examples/with-postcss) | Shows how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules). | ⭐️ |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components) | Shows how to work with [Styled Components](https://www.styled-components.com/docs). | ⭐️ |
| [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list) | Shows how to work with View Models in the **all events subscription** case | ⭐️⭐️ |
| [shopping-list-advanced](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-advanced) | Show to work with [React-Native](https://github.com/facebook/react-native) | ⭐️⭐️ |
| [with-saga](https://github.com/reimagined/resolve/tree/master/examples/with-saga) | Shows how to work with server saga | ⭐️⭐️ |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news) | The [HackerNews](https://news.ycombinator.com/) application clone with CQRS and EventSourcing. | ⭐️⭐️️️️⭐️️️️ |


![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-index-readme?pixel)
