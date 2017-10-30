# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.0.38"></a>
## [0.0.38](https://github.com/reimagined/resolve/compare/v0.0.28...v0.0.38) (2017-10-20)

### Bug Fixes

* **create-resolve-app:** change creation options ([86eaeb2](https://github.com/reimagined/resolve/commit/86eaeb2))
* **resolve-scripts:** add middlewares with empty params to create-resolve-app ([0ca16af](https://github.com/reimagined/resolve/commit/0ca16af)), closes [#279](https://github.com/reimagined/resolve/issues/279)
* **resolve-scripts:** display compile-time errors from server-side in dev mode ([41c41fc](https://github.com/reimagined/resolve/commit/41c41fc)), closes [#265](https://github.com/reimagined/resolve/issues/265)
* **resolve-scripts:** fix default config and error handling for graphql resolvers ([2bfd3c2](https://github.com/reimagined/resolve/commit/2bfd3c2))
* **resolve-scripts:** fix template ([d70aa12](https://github.com/reimagined/resolve/commit/d70aa12))
* **resolve-scripts:** fix templates issues ([f2b065a](https://github.com/reimagined/resolve/commit/f2b065a)), closes [#321](https://github.com/reimagined/resolve/issues/321) [#318](https://github.com/reimagined/resolve/issues/318) [#315](https://github.com/reimagined/resolve/issues/315)
* **resolve-scripts:** fix tests ([6984880](https://github.com/reimagined/resolve/commit/6984880))
* **resolve-scripts:** use server bundling without node_modules for socket.io  ([13e99ff](https://github.com/reimagined/resolve/commit/13e99ff))


### Features

* **resolve-query:** allow to pass custom params into read function and post-process result in adapters side ([34a68ff](https://github.com/reimagined/resolve/commit/34a68ff)), closes [#277](https://github.com/reimagined/resolve/issues/277)
* **resolve-command** add aggregate versioning ([288d0d8](https://github.com/reimagined/resolve/commit/288d0d8))
* **resolve-scripts:** add graphql endpoint ([826bf48](https://github.com/reimagined/resolve/commit/826bf48))
* **resolve-query:** split resolve-query to projection update and read-side part, which now can be run independently ([085e42d](https://github.com/reimagined/resolve/commit/085e42d)), closes [#316](https://github.com/reimagined/resolve/issues/316)
* **resolve-query:** implement independent default read-model memory adapter ([efaa5b2](https://github.com/reimagined/resolve/commit/efaa5b2))
* **resolve-redux:** add support for graphql provider out-of-box ([d4941f8](https://github.com/reimagined/resolve/commit/d4941f8))
* **resolve-scripts:** implement multiple read-models and better error handling ([aff2d5f](https://github.com/reimagined/resolve/commit/aff2d5f))
* **resolve-scripts:** provide jwt on client side ([1df756d](https://github.com/reimagined/resolve/commit/1df756d)), closes [#270](https://github.com/reimagined/resolve/issues/270)



### BREAKING CHANGES

* **resolve-scripts:** view models are available without graphql via get-request with appropriate view-model name in format `/api/query/${read_model_name}` with mandatory eventTypes and/or aggregateIds field for on-demand query
* **resolve-scripts:** read-models are provided in configuration by array instead of one element
- **resolve-scripts:** any read-model has own name, which used in query API in format `/api/query/${read_model_name}`
* **resolve-es:** rename rawSaveEvent to saveEventRaw



<a name="0.0.28"></a>
## [0.0.28](https://github.com/reimagined/resolve/compare/v0.0.27...v0.0.28) (2017-09-22)


### Bug Fixes

* make doc links relative ([#275](https://github.com/reimagined/resolve/issues/275)) ([bdc9ced](https://github.com/reimagined/resolve/commit/bdc9ced))


### Features

* **resolve-query** Read-model API with custom adaptors for projections ([3891448](https://github.com/reimagined/resolve/commit/3891448))


### Performance Improvements

* **resolve-storage-lite:** use nedb instead of simple file storage ([3ca48ba](https://github.com/reimagined/resolve/commit/3ca48ba))


### BREAKING CHANGES

* **resolve-query**  Rename all eventHandlers to projection, since it can be free-form entity, which is supported by selected read-model adapter
* **resolve-query** API of adaptor is changed, now it can build event handlers by input projection definition
* **resolve-scripts**  read-models in plural is renamed to read-model, which encapsulates whole read-model inside
* **resolve-storage-lite:** resolve-storage-memory and resolve-storage-file are replaced by resolve-storage-lite. This package supports two behaviors. Don't pass any arguments if you want to use it as in-memory storage and pass the path to the db file to use it as file storage.



<a name="0.0.27"></a>
## [0.0.27](https://github.com/reimagined/resolve/compare/v0.0.26...v0.0.27) (2017-09-20)


### Bug Fixes

* **resolve-scripts:** use only npm for installation ([#269](https://github.com/reimagined/resolve/issues/269)) ([7397b81](https://github.com/reimagined/resolve/commit/7397b81)), closes [#211](https://github.com/reimagined/resolve/issues/211)


### Features

* **resolve-redux:** add default params for saga middlewares ([bba49d8](https://github.com/reimagined/resolve/commit/bba49d8))


### Performance Improvements

* **resolve-scripts:** deleting unnecessary template files ([d01e562](https://github.com/reimagined/resolve/commit/d01e562)), closes [#200](https://github.com/reimagined/resolve/issues/200)

### BREAKING CHANGES

* **resolve-query:** Change read-model root
Change read-model root, implement posibility for persistent storage and async projection functions, segregate to read and view models, move graphql onto top-level of read-model, allow customize persistent storage provider

Used terms / system metaphor is specified. Read-model now is abstract entity, which perform handling incoming events by specified projection functions and storage manager, and then can be retrieved from storage in custom manner in GraphQL resolvers. What used to be called read models in plural is now one particular collection in one large reading model. All event handlers should be present for whole read-model, and can manipulate with any collections.

Together with this change, cross-read model GraphQL resolvers in old terms now is not needed, because in one read-side instance most likely there is only one read-model with several collections, which can be easily accessed. Also, real cross read-model GraphQL resolvers are supported, since resolver is custom asynchronous function, which can interact with any entity.
All read-models can be queried only by GraphQL query. View-models is kind of read-models, which can be retrieved only with full state, because they fit into client's memory. View-models can be used only with synchronous storage providers, which also support "full state" term, e.g. memory provider.

Custom storage provider are supported now. Every projection can be custom asynchronous function, which interacts with supplied storage provider. No custom providers goes with this change, but easily can be developed.
* renamed method `loadEventsByAggregateId` to `loadEventsByAggregateIds` in resolve-es adapters


<a name="0.0.26"></a>
## [0.0.26](https://github.com/reimagined/resolve/compare/v0.0.25...v0.0.26) (2017-09-08)


### Bug Fixes

* **resolve-scripts:** static content serving in production mode from dist directory ([9582382](https://github.com/reimagined/resolve/commit/9582382))


### Features

* **resolve-es:** implement raw event saver ([#219](https://github.com/reimagined/resolve/issues/219)) ([5326e4e](https://github.com/reimagined/resolve/commit/5326e4e))



<a name="0.0.25"></a>
## 0.0.25 (2017-09-08)


### Bug Fixes

* **resolve-scripts:** disable ssr in dev mode ([#233](https://github.com/reimagined/resolve/issues/233)) ([255ede1](https://github.com/reimagined/resolve/commit/255ede1))


### Features

* **resolve-query:** implement cross read-model graphql resolvers ([aed57ad](https://github.com/reimagined/resolve/commit/aed57ad))




