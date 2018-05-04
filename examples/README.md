The following tools are used to get a sample **reSolve** aplication:

* [npx](https://www.npmjs.com/package/npx)

    ```sh
    npx create-resolve-app todo-example -e todo
    ```

* [yarn](https://yarnpkg.com/lang/en/)

    ```sh
    yarn create resolve-app todo-example -e todo
    ```

* [npm](https://www.npmjs.com/)

    ```sh
    npm i -g create-resolve-app
    create-resolve-app todo-example -e todo
    ```

The created application is accessible using the http://localhost:3000/ and `http://<your_ip>:3000` URLs (you can [change your URL settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)).

The `create-resolve-app` can is capable to create the following apps:

* [**hello-world**](https://github.com/reimagined/resolve/tree/master/examples/hello-world)

    An empty app that can be used as a template for any **reSolve** application (created by default).

* [**top-list**](https://github.com/reimagined/resolve/tree/master/examples/top-list)

    This example demonstrates how to update application state on external events unrelated to user actions.

* [**todo**](https://github.com/reimagined/resolve/tree/master/examples/todo)

    This example demonstrates how to work with the [view-models](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md). The app's creation process is detailed in the [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md).

* [**todo-two-levels**](https://github.com/reimagined/resolve/tree/master/examples/todo-two-levels)

    This example demonstrates how to work with view-models in the **all events subscribtion** case. Learn more about this case in the [View Model](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md) article.

* [**hacker-news**](https://github.com/reimagined/resolve/tree/master/examples/hacker-news)

    This example demonstrates a Hacker News application that is similar to [YCombinator Hacker News](https://news.ycombinator.com/). The app's creation process is detailed in the [Hacker News Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/Hacker%20News%20Tutorial.md).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-index-readme?pixel)
