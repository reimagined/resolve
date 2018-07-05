
# [<img src="https://user-images.githubusercontent.com/15689049/29659048-ad0d158a-88c5-11e7-9354-dbe4bb105ad7.png" height="60">](https://github.com/reimagined/resolve/)

[![Build Status](https://travis-ci.org/reimagined/resolve.svg?branch=master)](https://travis-ci.org/reimagined/resolve) [![npm version](https://badge.fury.io/js/create-resolve-app.svg)](https://badge.fury.io/js/create-resolve-app) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/reimagined/resolve/master/LICENSE)

A JavaScript framework for **CQRS**, **Domain-Driven Design** and **Event Sourcing** with robust support for **React** and **Redux**. **reSolve** provides a new way to describe an app's core logic and fully separate it from auxiliary code.

<p align="center"><img src="https://user-images.githubusercontent.com/19663260/41475089-73b9620e-70c6-11e8-9ca9-633f3857626b.png"></p>

* 2 minutes [installation](#installation).
* [Free and open source](https://github.com/reimagined/resolve/blob/master/LICENSE.md).
* Flexible and clear [API](#documentation).

## **📑 Table of Contents**
* **[🚀 Getting Started](#getting-started)**
* **[📚 Documentation](#documentation)**
* **[📢 Get in Touch](#get-in-touch)**

## <a name="getting-started">**🚀 Getting Started**</a>

### <a name="installation">Installation</a>

The [create-resolve-app](packages/create-resolve-app) package is used to create a **reSolve**-based application. You can use it to get one of the examples, or create an empty application. By default, `create-resolve-app` generates an empty [Hello World](https://github.com/reimagined/resolve/tree/master/examples/hello-world) application. You can start working on your new **reSolve** application in just **2 minutes** using [npx](https://www.npmjs.com/package/npx/v/1.1.1)!

```sh
npx create-resolve-app my-awesome-app
cd my-awesome-app
npm run dev
```

The created application is accessible using the http://localhost:3000/ and `http://<your_ip>:3000/` URLs (you can [change the URL settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)). Start learning **reSolve** with the [**ToDo List App Tutorial**](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md) tutorial. Use the [**documentation**](#documentation), [**tutorials**](#tutorials) and [**examples**](#examples) to learn **reSolve** more deeply.

Instead of npx you can also use npm or yarn tools:

* [npm](https://www.npmjs.com/)

    > Note: Installing a package globally may require administrative privileges. That means you have to use the `sudo` prefix on Linux and MacOS, or start a terminal with the administrative privileges on Windows.

    ```sh
    npm i -g create-resolve-app
    create-resolve-app my-awesome-app
    cd my-awesome-app
    npm run dev
    ```

* [yarn](https://yarnpkg.com/lang/en/)

    ```sh
    yarn create resolve-app my-awesome-app
    cd my-awesome-app
    yarn run dev
    ```

### <a name="examples">Examples</a>

You can get a sample app using the `create-resolve-app` tool with the `-e` flag followed by an example name. Use the `create-resolve-app -h` command to list the available [examples](https://github.com/reimagined/resolve/tree/master/examples).

The following tools are used to get a sample **reSolve** application:

```sh
npx create-resolve-app todo-example -e todo
```

The created application is accessible using the http://localhost:3000/ and `http://<your_ip>:3000` URLs (you can [change your URL settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)).

Instead of npx you can also use npm or yarn tools:

* [yarn](https://yarnpkg.com/lang/en/)

    ```sh
    yarn create resolve-app todo-example -e todo
    ```

* [npm](https://www.npmjs.com/)

    ```sh
    npm i -g create-resolve-app
    create-resolve-app todo-example -e todo
    ```

## <a name="documentation">**📚 Documentation**</a>

You can develop and run **reSolve** applications on **Linux**, **Mac** and **Windows** operating systems. It is also possible to integrate **reSolve** with the **React Native**, but this approach is currently experimental.

The minimum supported **NodeJS** version is **8.0.0**.

**reSolve** supports [**npx**](https://www.npmjs.com/package/npx), [**yarn**](https://yarnpkg.com/lang/en/), and [**npm**](https://www.npmjs.com/) package tools.

Learn more in [documentation topics](https://github.com/reimagined/resolve/tree/master/docs).

## <a name="get-in-touch">**📢 Get in Touch**</a>

Feel free to contact us if you have any questions!

✉️ We are glad to see your e-mails sent to **reimagined@devexpress.com**.

💬 Follow us on [**Twitter**](https://twitter.com/resolvejs). We post interesting arcticles, announcements, post polls about **reSolve** development and talk about the modern web technologies!

💻 We also have a [**Facebook**](https://www.facebook.com/resolvejs/) page, join us!

📃 You can find our articles on [**Medium**](https://medium.com/resolvejs)

❓ You are welcome to post any questions or suggestions in [**GitHub Issues**](https://github.com/reimagined/resolve/issues)

🔧 Feel yourself capable of improving **reSolve**? Become one of our [**contributors**](https://github.com/reimagined/resolve/pulls)! Look through our [**Contrubutors Guide**](https://github.com/reimagined/resolve/blob/master/docs/Contributors%20Guide.md) and make a great Pull Request.

⭐️ Remember to star our **GitHub** repository if you like **reSolve**!

<br/>
<br/>
<p align="center">reSolve is developed by</p>
<p align="center"><a href="https://devexpress.com">Developer Express Inc.</a></p>
<p align="center"><img src="https://user-images.githubusercontent.com/19663260/38686793-dd31fb22-3e7d-11e8-8f26-33606ad82a16.png"></p>

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/index-readme?pixel)
