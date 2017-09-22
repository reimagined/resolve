# Change Log

All notable changes to this project will be documented in this file.
See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.0.28"></a>
## 0.0.28 (2017-09-22)


### Bug Fixes

* make doc links relative ([#275](https://github.com/reimagined/resolve/issues/275)) ([bdc9ced](https://github.com/reimagined/resolve/commit/bdc9ced))


### Features

* **resolve-query:** implement cross read-model graphql resolvers ([aed57ad](https://github.com/reimagined/resolve/commit/aed57ad))
* Read-model API with custom adaptors for projections ([3891448](https://github.com/reimagined/resolve/commit/3891448))


### Performance Improvements

* **resolve-storage-lite:** use nedb instead of simple file storage ([3ca48ba](https://github.com/reimagined/resolve/commit/3ca48ba))


### BREAKING CHANGES

* Rename all eventHandlers to projection, since it can be free-form entity, which is supported by selected read-model adapter
* API of adaptor is changed, now it can build event handlers by input projection definition
* In resolve-scripts, read-models in plural is renamed to read-model, which encapsulates whole read-model inside
* **resolve-storage-lite:** resolve-storage-memory and resolve-storage-file are replaced by resolve-storage-lite. This package supports two behaviors. Don't pass any arguments if you want to use it as in-memory storage and pass the path to the db file to use it as file storage.



<a name="0.0.2"></a>
## 0.0.2 (2017-05-30)




<a name="0.0.27"></a>
## 0.0.27 (2017-09-20)


### Features

* **resolve-query:** implement cross read-model graphql resolvers ([aed57ad](https://github.com/reimagined/resolve/commit/aed57ad))



<a name="0.0.2"></a>
## 0.0.2 (2017-05-30)




<a name="0.0.26"></a>
## 0.0.26 (2017-09-08)


### Features

* **resolve-query:** implement cross read-model graphql resolvers ([aed57ad](https://github.com/reimagined/resolve/commit/aed57ad))



<a name="0.0.2"></a>
## 0.0.2 (2017-05-30)




<a name="0.0.25"></a>
## 0.0.25 (2017-09-08)


### Features

* **resolve-query:** implement cross read-model graphql resolvers ([aed57ad](https://github.com/reimagined/resolve/commit/aed57ad))



<a name="0.0.2"></a>
## 0.0.2 (2017-05-30)
