### Creating a new app with template code

This folder contains template projects that you can use to create new reSolve applications.

The following template projects are available:

| Template Name                                                                                         | Description                                                                               |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [angular](https://github.com/reimagined/resolve/tree/master/templates/ts/angular)                     | An application that uses Angular on the client.                                           |
| [postcss](https://github.com/reimagined/resolve/tree/master/templates/ts/postcss)                     | An application that uses [PostCSS](https://github.com/postcss/postcss-loader#css-modules) |
| [react](https://github.com/reimagined/resolve/tree/master/templates/ts/react)                         | An application with a React client.                                                       |
| [styled-components](https://github.com/reimagined/resolve/tree/master/templates/ts/styled-components) | An application that uses [styled-components](https://styled-components.com/docs)          |
| [vanilla](https://github.com/reimagined/resolve/tree/master/templates/ts/vanilla)                     | An application that uses pure TypeScript or JavaScript on the client.                     |
| [vue](https://github.com/reimagined/resolve/tree/master/templates/ts/vue)                             | An application with a Vue.js client.                                                      |

You can create a new application based on a template code using the `create-resolve-app` command with the `-e` flag followed by a template name. Use the `create-resolve-app -h` command to list the available templates.

```sh
npx create-resolve-app resolve-example -e <example name>
```
