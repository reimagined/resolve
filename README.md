# resolve
Resolve is a toolset for building app based on CQRS and EventSourcing patterns.

The toolset includes next libraries:
- [resolve-bus](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus)
- [resolve-bus-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-memory)
- [resolve-bus-rabbitmq](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-rabbitmq)
- [resolve-bus-zmq](https://github.com/reimagined/resolve/tree/master/packages/resolve-bus-zmq)
- [resolve-command](https://github.com/reimagined/resolve/tree/master/packages/resolve-command)
- [resolve-es](https://github.com/reimagined/resolve/tree/master/packages/resolve-es)
- [resolve-query](https://github.com/reimagined/resolve/tree/master/packages/resolve-query)
- [resolve-redux](https://github.com/reimagined/resolve/tree/master/packages/resolve-redux)
- [resolve-storage](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage)
- [resolve-storage-file](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-file)
- [resolve-storage-memory](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-memory)
- [resolve-storage-mongo](https://github.com/reimagined/resolve/tree/master/packages/resolve-storage-mongo)

## Quick start

To start, run next commands in terminal:
```
git clone https://github.com/reimagined/resolve-boilerplate my-app
cd my-app
npm install
npm run dev
```
After that open [http://localhost:3000](http://localhost:3000) in a browser to see app.

To build app for production just run:
```
npm run build
```
And then `npm start` to run app in production mode.

**App supports es6 syntaxis and hot-reload out of the box.**

For more information see this [guide](https://github.com/reimagined/resolve-boilerplate)
