# Hacker News App

![hn](https://user-images.githubusercontent.com/19663260/41345723-23bce79a-6f0d-11e8-891a-ceb39c86db62.png)

This example demonstrates [HackerNews](https://news.ycombinator.com/) application clone with CQRS and EventSourcing. To install:

```bash
npx create-resolve-app hacker-news-example -e hacker-news
```

To run:

```bash
npm run dev
```

Starts the app in development mode.
Provides hot reloading, source mapping and other development capabilities.

```bash
npm run build
npm start
```

Starts the application in production mode.

After you run the application you can view it at [http://localhost:3000/](http://localhost:3000/).

## Data Import

```bash
npm run import
```

Imports data (up to 500 stories with comments) from [HackerNews](https://news.ycombinator.com/).
Press `Control-C` to stop importing or wait until it is finished.

## What's next?

📑 The app's creation process is detailed in the [**Hacker News Tutorial**](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/Hacker%20News%20Tutorial.md).

📑 You can learn more about read-models in a [**Read Model**](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md) topic.

📑 Available scripts, project structure overview, configuration files, and more useful information can be found in the [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 Refer to the [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic to learn more about common architecture building principles.

📑 You can learn how to create simple applications with reSolve in the [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) section.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-hacker-news-readme?pixel)
