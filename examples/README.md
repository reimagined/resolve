# **Examples**

-------------------------------------------------------------------------
Sorry, this article isn't finished yet :(
    
We'll glad to see all your questions:
* [**GitHub Issues**](https://github.com/reimagined/resolve/issues)
* [**Twitter**](https://twitter.com/resolvejs)
* e-mail to **reimagined@devexpress.com**
-------------------------------------------------------------------------

This folder contains reSolve framework examples.

Example setup is similar with new application creation, but it has `--example` or `-e` flag with example name. You can start working with reSolve example just in **2 minutes**.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-example-installation.gif"></p>

The created example is hosted at http://localhost:3000/ and http://<your_ip>:3000/ (you can [change your url settings](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md)). Also you can look at [**tutorials**](#tutorials) for some examples.

#### Using npx
```bash
npx create-resolve-app todo-example -e todo
```

#### Using yarn
```bash
yarn create resolve-app todo-example -e todo
```

#### Using npm
```bash
create-resolve-app todo-example -e todo
```

* [**hello-world**](./hello-world)

It's a simple empty example that can be used like **reSolve application boilerplate**.

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-hello-world-example.png"></p>

* [**top-list**](./top-list)

This example demonstrates **reactive read-models** that leads to client updating without page reloads. You can learn more about [read-models in documentation](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md)

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-top-list-example.png"></p>

* [**todo**](./todo)

This example demonstrates **simple work with view-models**. You can learn more in [ToDo List App Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/ToDo%20List%20App%20Tutorial.md) and [documentation](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md).

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-todo-example.png"></p>

* [**todo-two-levels**](./todo-two-levels)

This example demonstrates work with view-models in case of **all events subscribtion**. Sometimes, for example for fast application prototyping, it's necessary to have view-model on client with all server events instead of part. There's a special feature called **wildcard**, that allows to subscribe to all events, you can learn more about that in [documentation](https://github.com/reimagined/resolve/blob/master/docs/View%20Model.md).

<p align="center"><img src="https://github.com/reimagined/resolve/blob/feature/new_readme/readme-todo-two-levels-example.png"></p>

* [**hacker-news**](./hacker-news)

This example demonstrates [HackerNews](https://news.ycombinator.com/) application clone with CQRS and EventSoucring.