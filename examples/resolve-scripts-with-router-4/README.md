# Example: React-router-4
**React-router-4** is simple SPA application, based on resolve boilerplate and equipped with **react-router@4** package for server & client sides routing.
The main goal of this packet to show how to add a router to the standard resolve boilerplate and ensure that server-side rendering works fine.

Read more about philosophy and technical details of React Router v4: [https://reacttraining.com/react-router/web/guides/philosophy](https://reacttraining.com/react-router/web/guides/philosophy)

**Important node**: when configuring router inctance on server side, ensure that it wrapped in component this way:
```
rootComponent: (props, context) =>
    <StaticRouter location={props.url} context={{}}>
        <RootComponent />
    </StaticRouter>
```

Current URL from server-side rendering will be available in property `props.url`.

If needed, you can handle manually redirect case by using `Helmet` and rendering redirect header in it. More information here: [https://github.com/nfl/react-helmet](https://github.com/nfl/react-helmet).

## Quick start

To start, run next commands in terminal:
```
git clone https://github.com/reimagined/resolve
cd resolve
npm install && npm run bootstrap
cd examples/resolve-scripts-with-router-4
npm start

```
After that open [http://localhost:3000](http://localhost:3000) in a browser to see app.

## Folder Structure

| ​Path ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​ ​​ ​ ​ ​ ​ ​​ ​ ​ ​ ​| Description                                                                              |
| ---------------------------------| ---------------------------------------------------------------------------------------- |
| `resolve-scripts-with-router-4/` | root directory as resolve-boilerplate copy                                               |
| `​ ​ ​index.js                    ` | root react component for viewing dependent on selected route, based on `<Switch>`        |
| `​ ​ package.json                ` | description of current npm package                                                       |
| `​ ​ README.md                   ` | this readme file                                                                         |
| `​ ​ resolve.client.config.js    ` | client-side boilerplate config, includes `react-router-dom`/`<BrowserRouter>` as router  |
| `​ ​ resolve.server.config.js    ` | server-side boilerplate config, includes `react-router`/`<StaticRouter>` as router       |


## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Supported Language Features and Polyfills

This project supports a superset of the latest JavaScript standard.<br>
In addition to [ES7](http://2ality.com/2016/01/ecmascript-2016.html) syntax features, it also supports:

* [Async/await](https://github.com/tc39/ecmascript-asyncawait) (ES2017).
* [Object Rest/Spread Properties](https://github.com/sebmarkbage/ecmascript-rest-spread) (stage 3 proposal).
* [JSX](https://facebook.github.io/react/docs/introducing-jsx.html) syntax.
