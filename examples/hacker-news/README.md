# Hacker News App

## How to start?

This example demonstrates [HackerNews](https://news.ycombinator.com/) application clone with CQRS and EventSoucring. To setup:

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
Press `Crtl-C` to stop importing or wait until it is finished.

## What's next?

📑 The app's creation process is detailed in the [Hacker News Tutorial](https://github.com/reimagined/resolve/blob/master/docs/Tutorials/Hacker%20News%20Tutorial.md).

📑 You can learn more about read-models in [**Read Model**](https://github.com/reimagined/resolve/blob/master/docs/Read%20Model.md) topic.

📑 Available scripts, project structure overview, configuration files and much other useful information are in [**API References**](https://github.com/reimagined/resolve/blob/master/docs/API%20References.md) topic.

📑 To learn more about common building principles of architecture, please look at [**Architecture**](https://github.com/reimagined/resolve/blob/master/docs/Architecture.md) documentation topic.

📑 In [**Tutorials**](https://github.com/reimagined/resolve/tree/master/docs/Tutorials) you can find how to make some simple applications with reSolve.

