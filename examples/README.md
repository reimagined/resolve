### Creating new app with an example code

This folder contains example projects implemented with reSolve. You can use them to study various use-case scenarios or as templates for new reSolve applications.

The following example projects are available:

| Example Name                                                                                                                | Description                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [hello-world](https://github.com/reimagined/resolve/tree/master/examples/hello-world)                                       | A blank app used as a default template for new reSolve applications.                                                |
| [hello-world-typescript](https://github.com/reimagined/resolve/tree/master/examples/hello-world-typescript)                 | A blank app used as a default template for new reSolve applications with TypeScript support.                        |
| [with-postcss](https://github.com/reimagined/resolve/tree/master/examples/with-postcss)                                     | Demonstrates how to work with [postCSS](https://github.com/postcss/postcss-loader#css-modules).                     |
| [with-styled-components](https://github.com/reimagined/resolve/tree/master/examples/with-styled-components)                 | Demonstrates how to work with [Styled Components](https://www.styled-components.com/docs).                          |
| [with-angular](https://github.com/reimagined/resolve/tree/master/examples/with-angular)                                     | Demonstrates how to use Angular to implement the client application.                                                |
| [with-vue](https://github.com/reimagined/resolve/tree/master/examples/with-vue)                                             | Demonstrates how to use Vue.js to implement the client application.                                                 |
| [with-vanillajs](https://github.com/reimagined/resolve/tree/master/examples/with-vanillajs)                                 | Demonstrates how to use the **@resolve-js/client** library to implement the client application in plain JavaScript. |
| [shopping-list](https://github.com/reimagined/resolve/tree/master/examples/shopping-list)                                   | Demonstrates how to work with Read Models and View Models.                                                          |
| [shopping-list-with-hooks](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-with-hooks)             | Demonstrates how to use the **@resolve-js/react-hooks** client library tp communicate with the backend.             |
| [shopping-list-with-redux-hooks](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-with-redux-hooks) | Demonstrates how to use the **@resolve-js/redux** library's hooks to communicate with the backend.                  |
| [shopping-list-advanced](https://github.com/reimagined/resolve/tree/master/examples/shopping-list-advanced)                 | Demonstrates how to use reSolve with [React Native](https://github.com/react-community/create-react-native-app)     |
| [hacker-news](https://github.com/reimagined/resolve/tree/master/examples/hacker-news)                                       | A clone of the [HackerNews](https://news.ycombinator.com/) application implemented using reSolve.                   |
| [cli-uploader](https://github.com/reimagined/resolve/tree/master/examples/cli-uploader)                                     | Demonstrates how to design a file uploader utility and handle file uploads on the server.                           |
| [image-gallery](https://github.com/reimagined/resolve/tree/master/examples/image-gallery)                                   | Demonstrates how to implement an image gallery and handle image uploads on the server.                              |
| [personal-data](https://github.com/reimagined/resolve/tree/master/examples/personal-data)                                   | Demonstrates how to store encrypted personal data.                                                                  |

You can create a new application based on example code using the `create-resolve-app` command with the `-e` flag followed by an example name. Use the `create-resolve-app -h` command to list the available examples in this folder.

```sh
npx create-resolve-app resolve-example -e <example name>
```
