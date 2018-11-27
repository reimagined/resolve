# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)

![CQRS DDD Event Sourcing React Redux](https://user-images.githubusercontent.com/19663260/41475089-73b9620e-70c6-11e8-9ca9-633f3857626b.png)

reSolve is a full stack functional JavaScript framework.

- [CQRS](https://martinfowler.com/bliki/CQRS.html) - independent Command and Query sides.
- [DDD Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html) support.
- [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - uses events as a source of truth and calculates read models from them.
- Integrates with [React](https://reactjs.org) and [Redux](https://redux.js.org) for seamless development experience.
- [React Native](https://facebook.github.io/react-native/) support.

## :rocket: Getting Started

### Installation

Make sure you have **NodeJS** version **8.10.0** or higher.

Use [create-resolve-app](packages/core/create-resolve-app) package to create a new reSolve application. The easiest way is to use [npx](https://www.npmjs.com/package/npx/v/1.1.1) ()

```sh
npx create-resolve-app my-awesome-app
cd my-awesome-app
npm run dev
```

<details>
<summary>You can also use npm or yarn tools</summary>

#### [npm](https://www.npmjs.com/)

> Note: Installing a package globally may require administrative privileges. That means you have to use the `sudo` prefix on Linux and MacOS, or start a terminal with the administrative privileges on Windows.

```sh
npm i -g create-resolve-app
create-resolve-app my-awesome-app
cd my-awesome-app
npm run dev
```

#### [yarn](https://yarnpkg.com/lang/en/)

```sh
yarn create resolve-app my-awesome-app
cd my-awesome-app
yarn run dev
```

</details>
<p></p>

Your application will be running at http://localhost:3000/.

### Creating a new app with a code example

You can create a new application with a code example using `create-resolve-app` with the `-e` flag followed by the example's name. Use the `create-resolve-app -h` command to list the available [examples](./examples/).

For instance, to run the [shopping-list](./examples/shopping-list) example, run:

```sh
npx create-resolve-app resolve-example -e shopping-list
```

## :books: Documentation

You can find reSolve documentation in the [docs section](./docs).

## :loudspeaker: Get in Touch

- Ask questions on Stackoverlow with [resolvejs tag](https://stackoverflow.com/questions/ask?tags=resolvejs)
- Use [GitHub Issues](https://github.com/reimagined/resolve/issues) to report bugs and suggest features
- Email team reimagined@devexpress.com
- Follow [@resolvejs on Twitter](https://twitter.com/resolvejs) or join [our Facebook page](https://www.facebook.com/resolvejs/) for product news and updates.

reSolve is developed by [Developer Express Inc.](https://devexpress.com)

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/readme.md?pixel)
