### Creating new app with an example code

This folder contains example projects implemented with reSolve. You can use them to study various use-case scenarios or as templates for new reSolve applications.

The following example projects are available:

| Example Name                                                                                                | Description                                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world)                       | A blank app used as a default template for new reSolve applications                                             |
| [with-postcss](https://github.com/reimagined/resolve/tree/master/examples/with-postcss)                     | Demonstrates how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules)                  |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components) | Demonstrates how to work with [Styled Components](https://www.styled-components.com/docs)                       |
| [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list)                   | Demonstrates how to work with Read Models and View Models                                                       |
| [shopping-list-advanced](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-advanced) | Demonstrates how to use reSolve with [React Native](https://github.com/react-community/create-react-native-app) |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news)                       | A clone of the [HackerNews](https://news.ycombinator.com/) application implemented using reSolve                |

You can create a new application based on example code using the `create-resolve-app` command with the `-e` flag followed by an example name. Use the `create-resolve-app -h` command to list the available examples in this folder.

```sh
npx create-resolve-app resolve-example -e <example name>
```
