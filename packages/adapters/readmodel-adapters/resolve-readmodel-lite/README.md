# **resolve-readmodel-lite**
[![npm version](https://badge.fury.io/js/resolve-readmodel-lite.svg)](https://badge.fury.io/js/resolve-readmodel-lite)

A **Read Model Adapter** for [SQLite](https://www.sqlite.org/) database.
The adapter provides a query API for projection and resolvers. This API is similar to the other reSolve adapters API, which means you can change a **Read Model Adapter** in the configuration file without changing the code.

## Available Parameters
* `databaseFile` - location of database in file system, may be ":memory:" for in-memory temporary storage.
* `preferEventBusLedger` - store ledger in event bus instead read-model database itself.

Adapter interface is provided by **resolve-readmodel-base** package.

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-resolve-readmodel-lite-readme?pixel)
