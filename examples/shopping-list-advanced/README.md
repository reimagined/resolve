# Shopping List Advanced Example

This example demonstrates how to use [React Native](https://github.com/react-community/create-react-native-app) in a reSolve app.

| Web |
| ------ |
| <img src="https://user-images.githubusercontent.com/5055654/44654333-fcead780-a9f9-11e8-9527-05ac55526e44.gif" height="252" />  |

| Android | Ios |
| ---------- | ---- |
| <img src="https://user-images.githubusercontent.com/5055654/44654326-f4929c80-a9f9-11e8-83f3-855030b0d42c.gif" height="400" />  | <img src="https://user-images.githubusercontent.com/5055654/44654321-efcde880-a9f9-11e8-8bca-b4c02a6f5158.gif" height="400" /> |

Get the example: 

!!! Warning: use this example only with `yarn` !!! 

```sh
yarn create resolve-app -e shopping-list-advanced shopping-list-advanced
```

Run the example:

1. First Terminal

    ```sh
    yarn dev
    ```

    Runs your web app in development mode.

2. Second Terminal

    ```sh
    yarn start:native
    ```

    Runs your native app in development mode with an interactive prompt. To run it without a prompt, use the `--no-interactive` flag.

3. Install the [Expo](https://expo.io) app to your iOS or Android phone, and use the QR code from the terminal to open your app. You can find the QR scanner on the **Projects** tab in **Expo**.

When you are ready to share your project with others (for example, by deploying to an app store), refer to the [Sharing & Deployment](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#sharing-and-deployment) section. 


### Project Structure Overview
```
📁 react-native-shopping-list
    📁 domain
        📁 auth
            📄 config.js
            📄 jwt_secret.js
        📁 aggregates
            📄 aggregate-name.commands.js
            📄 aggregate-name.projection.js
        📁 read-models
            📄 read-model-name.projection.js
            📄 read-model-name.resolvers.js
        📁 view-models
            📄 view-model-name.projection.js
            📄 view-model-name.serialize_state.js
            📄 view-model-name.deserialize_state.js
        📄 eventTypes.js
        📄 package.json
    📁 web
        📁 components
        📁 containers
            📄 App.js
        📁 redux
            📁 store
                📄 config.js
            📁 reducers
                📄 config.js
            📁 middlewares
                📄 config.js
        📁 static
        📁 test
        📄 routes.js
        📄 jest.config.js
        📄 package.json
    📁 native
        📁 components
        📁 containers
            📄 App.js
        📁 redux
            📁 store
                📄 config.js
            📁 reducers
                📄 config.js
            📁 middlewares
                📄 config.js
        📁 test
        📄 config.js
        📄 app.json
        📄 jest.config.js
        📄 package.json
    📁 ui
        📁 Component1
            📄 index.android.js
            📄 index.ios.js
            📄 index.js
        📁 Component2
            📄 index.android.js
            📄 index.ios.js
            📄 index.js
        📄 package.json
    📁 utils
        📄 calc_something.js
        📄 package.json
    📄 package.json
    📄 config.app.js	
    📄 config.dev.js
    📄 config.prod.js
    📄 config.test_functional.js
    📄 index.js
    📄 README.md
    📄 .gitignore
```
