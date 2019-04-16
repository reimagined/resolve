# Shopping List Advanced Example

This example demonstrates how to use [React Native](https://github.com/react-community/create-react-native-app) in a reSolve app.

| Web                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------ |
| <img src="https://user-images.githubusercontent.com/5055654/44654333-fcead780-a9f9-11e8-9527-05ac55526e44.gif" height="252" /> |

| Android                                                                                                                        | Ios                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| <img src="https://user-images.githubusercontent.com/5055654/44654326-f4929c80-a9f9-11e8-83f3-855030b0d42c.gif" height="400" /> | <img src="https://user-images.githubusercontent.com/5055654/44654321-efcde880-a9f9-11e8-8bca-b4c02a6f5158.gif" height="400" /> |

Get the example:

!!! Warning: use this example only with `yarn` !!!

```sh
yarn create resolve-app -e shopping-list-advanced shopping-list-advanced
```

Run the example:

1. First Terminal

   ```sh
   yarn dev:native
   ```

   Runs your web app in development mode.

2. Second Terminal

   ```sh
   yarn start:native
   ```

   Runs your native app in development mode with an interactive prompt. To run it without a prompt, use the `--no-interactive` flag.

3. Install the [Expo](https://expo.io) app to your iOS or Android phone, and use the QR code from the terminal to open your app. You can find the QR scanner on the **Projects** tab in **Expo**.

### Project Structure Overview

```
📁 shopping-list-advanced
    📁 web
        📁 client
            📁 components
            📁 containers
            📁 decorators
            📁 redux
                📁 enhancers
                📁 middlewares
                📁 reducers
                📄 action-types.js
            📄 routes.js
        📁 common
            📁 aggregates
            📁 auth
            📁 read-models
            📁 view-models
        📁 static
        📁 test
        📄 babel.config.js
        📄 config.app.js
        📄 config.cloud.js
        📄 config.dev.js
        📄 config.prod.js
        📄 config.test-functional.js
        📄 jest.config.js
        📄 jest.transform.js
        📄 jest-setup.js
        📄 package.json
        📄 run.js
    📁 native
        📁 assets
        📁 components
        📁 constants
        📁 containers
        📁 decorators
        📁 redux
            📁 enhancers
            📁 middlewares
            📁 reducers
            📁 store
            📄 action-types.js
        📁 test
        📄 app.json
        📄 babel.config.js
        📄 index.js
        📄 jest.config.js
        📄 jest.transform.js
        📄 jest-setup.js
        📄 package.json
        📄 rn-cli.config.js
        📄 routes.js
    📁 ui
        📁 assets
        📁 src
            📄 index.js
            📄 Logo.js
            📄 Logo.native.js
        📁 test
        📄 jest.config.native.js
        📄 jest.config.web.js
        📄 jest.transform.native.js
        📄 jest.transform.web.js
        📄 jest-setup.js
        📄 package.json
    📄 .gitignore
    📄 package.json
    📄 README.md
```
