# Hacker News App

![hn](https://user-images.githubusercontent.com/19663260/41345723-23bce79a-6f0d-11e8-891a-ceb39c86db62.png)

This example is a clone of the [Hacker News](https://news.ycombinator.com/) application implemented with CQRS and EventSourcing. To install:

```bash
npx create-resolve-app hacker-news-example -e hacker-news
```

To run:

```bash
npm run dev
```

Starts the app in development mode.
This mode supports hot reloading, source mapping and other development capabilities.

```bash
npm run build
npm start
```

Starts the application in production mode.

After you run the application, you can view it at [http://localhost:3000/](http://localhost:3000/).

## Data Import

```bash
npm run import
```

Imports data (up to 500 stories with comments) from [Hacker News](https://news.ycombinator.com/).
Press `Control-C` to stop importing or wait until it is finished.

## What's next?

📑 You can learn more about read-models in a [**Read Models**](https://reimagined.github.io/resolve/docs/read-side#read-models) topic.

📑 Available scripts, project structure overview, configuration files, and more useful information can be found in the [**API References**](https://reimagined.github.io/resolve/docs/api-reference) topic.

📑 You can learn how to create simple applications with reSolve in the [**Step-by-Step Tutorial**](https://reimagined.github.io/resolve/docs/tutorial).

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/examples-hacker-news-readme?pixel)
