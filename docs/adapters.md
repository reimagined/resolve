---
id: adapters
title: Adapters
---

ReSolve uses the **adapter** mechanism to provide an abstraction layer above APIs used by its subsystems. For instance, adapters are used to define how a reSolve application stores its data. This allows reSolve to abstract away all direct interactions with the underlying storage and expose a unified data management API.

ReSolve uses different types of adapters depending on which kind of data needs to be stored.

- **Event store adapters**
- **Read model store adapters**

Resolve includes a set of adapters compatible with popular Database Management Systems (DBMS). You can also implement new adapters to store data in any required way.

Note that reSolve does not force you to use adapters. For example, you may need to implement a Read Model on top of some arbitrary system, such as a full-text-search engine, OLAP or a particular SQL database. In such case, you can just work with that system in the code of the projection function and query resolver, without writing a new Read Model adapter.
