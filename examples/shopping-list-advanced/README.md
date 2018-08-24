# React Native Shopping List Example

This example demonstrates how to use [React Native](https://github.com/react-community/create-react-native-app) in a reSolve app.

| ![Web](https://user-images.githubusercontent.com/5055654/43512907-fbed0490-9584-11e8-8065-27a26abcbe41.png)           | ![React-native](https://user-images.githubusercontent.com/5055654/43513480-828fe250-9586-11e8-8999-c29114134e33.png) |
|-----|--------------|

Get the example:

```sh
npx create-resolve-app -e react-native-shopping-list react-native-shopping-list
```

Run the example:

1. First Terminal

    ```sh
    npm run dev:web
    ```

    Runs your web app in development mode.

2. Second Terminal

    ```sh
    npm run start:native
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
            📄 jwtSecret.js
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
            📄 index.web.js
        📁 Component2
            📄 index.android.js
            📄 index.ios.js
            📄 index.web.js
        📄 package.json
    📁 utils
        📄 calcSomething.js
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

# Screenshots
TODO
![resolve react native shopping list example 7](https://user-images.githubusercontent.com/5055654/44088408-a999f666-9fcb-11e8-81ec-fa657b03eea9.png)
![resolve react native shopping list example 3](https://user-images.githubusercontent.com/5055654/44088404-a91b208e-9fcb-11e8-9a59-650258cff342.png)
![resolve react native shopping list example 4](https://user-images.githubusercontent.com/5055654/44088405-a9393cfe-9fcb-11e8-9667-c02e2322034e.png)
![resolve react native shopping list example 5](https://user-images.githubusercontent.com/5055654/44088406-a95623dc-9fcb-11e8-93e0-d783d9e0985a.png)
![resolve react native shopping list example 6](https://user-images.githubusercontent.com/5055654/44088407-a9772d98-9fcb-11e8-8392-8fb309e6d3a6.png)
