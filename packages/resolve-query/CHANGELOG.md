# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.


<a name="0.0.38"></a>
## [0.0.38](https://github.com/reimagined/resolve/compare/v0.0.28...v0.0.38) (2017-10-20)

### Features

* allow to pass custom params into read function and post-process result in adapters side ([34a68ff](https://github.com/reimagined/resolve/commit/34a68ff)), closes [#277](https://github.com/reimagined/resolve/issues/277)
* split resolve-query to projection update and read-side part, which now can be run independently ([085e42d](https://github.com/reimagined/resolve/commit/085e42d)), closes [#316](https://github.com/reimagined/resolve/issues/316)
* implement independent default read-model memory adapter ([efaa5b2](https://github.com/reimagined/resolve/commit/efaa5b2))



<a name="0.0.28"></a>
## [0.0.28](https://github.com/reimagined/resolve/compare/v0.0.27...v0.0.28) (2017-09-22)



### Features

* read-model API with custom adaptors for projections ([3891448](https://github.com/reimagined/resolve/commit/3891448))


### BREAKING CHANGES

* rename all eventHandlers to projection, since it can be free-form entity, which is supported by selected read-model adapter
* API of adaptor is changed, now it can build event handlers by input projection definition



<a name="0.0.27"></a>
## [0.0.27](https://github.com/reimagined/resolve/compare/v0.0.26...v0.0.27) (2017-09-22)


### BREAKING CHANGES

* Change read-model root

Change read-model root, implement posibility for persistent storage and async projection functions, segregate to read and view models, move graphql onto top-level of read-model, allow customize persistent storage provider

Used terms / system metaphor is specified. Read-model now is abstract entity, which perform handling incoming events by specified projection functions and storage manager, and then can be retrieved from storage in custom manner in GraphQL resolvers. What used to be called read models in plural is now one particular collection in one large reading model. All event handlers should be present for whole read-model, and can manipulate with any collections.

Together with this change, cross-read model GraphQL resolvers in old terms now is not needed, because in one read-side instance most likely there is only one read-model with several collections, which can be easily accessed. Also, real cross read-model GraphQL resolvers are supported, since resolver is custom asynchronous function, which can interact with any entity.
All read-models can be queried only by GraphQL query. View-models is kind of read-models, which can be retrieved only with full state, because they fit into client's memory. View-models can be used only with synchronous storage providers, which also support "full state" term, e.g. memory provider.

Custom storage provider are supported now. Every projection can be custom asynchronous function, which interacts with supplied storage provider. No custom providers goes with this change, but easily can be developed.

* renamed method `loadEventsByAggregateId` to `loadEventsByAggregateIds` in resolve-es drivers


<a name="0.0.25"></a>
## 0.0.25 (2017-09-08)


### Features

* implement cross read-model graphql resolvers ([aed57ad](https://github.com/reimagined/resolve/commit/aed57ad))
