# React-Native Todo Example

This example demonstrates how to work with [react-native (expo)](https://github.com/react-community/create-react-native-app). Get the example using this command:

```sh
npx create-resolve-app resolve-with-postcss-example -e react-native-todo
```

| ![Web](https://user-images.githubusercontent.com/5055654/43512907-fbed0490-9584-11e8-8065-27a26abcbe41.png)           | ![React-native](https://user-images.githubusercontent.com/5055654/43513480-828fe250-9586-11e8-8999-c29114134e33.png) |
|-----|--------------|

Install the [Expo](https://expo.io) app on your iOS or Android phone, and use the QR code in the terminal to open your app. Find the QR scanner on the Projects tab of the app. When you're ready to share your project with others (for example, by deploying to an app store), read the [Sharing & Deployment](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#sharing-and-deployment) section of the User Guide.

To run:

1\) First Terminal
```sh
npm run dev:web
```
Runs your the web app in development mode.

2\) Second Terminal
```sh
npm run start:native
```
Runs your native app in development mode with an interactive prompt. To run it without a prompt, use the --no-interactive flag.

Open it in the [Expo app](https://expo.io) on your phone to view it. It will reload if you save edits to your files, and you will see build errors and logs in the terminal.

### Project Structure Overview
```
📁 react-native-todo
    📁 web
        📁 client
            📁 components
            📁 containers
                📄 App.js
            📁 reducers
                📄 index.js
            📁 store
                📄 index.js
            📁 middlewares
                📄 index.js
            📄 routes.js
        📁 common
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
        📁 build-extenders
            📄 config-for-react-native.js
        📁 static
        📁 test
        📄 .babelrc
        📄 jest.config.js
        📄 package.json
        📄 resolve.build.config.js
        📄 resolve.config.json
    📁 native
        📁 components
        📁 containers
            📄 App.js
        📁 reducers
            📄 index.js
        📁 store
            📄 index.js
        📁 middlewares
            📄 index.js
        📁 test
        📄 index.js
        📄 app.json
        📄 jest.config.js
        📄 package.json
    📁 ui
        📁 Component1
            📄 Component1.android.js
            📄 Component1.ios.js
            📄 Component1.web.js
        📁 Component2
            📄 Component2.android.js
            📄 Component2.ios.js
            📄 Component2.web.js
    📁 utils
        📄 calcSomething.js
    📄 package.json
    📄 README.md
    📄 .gitignore
```
